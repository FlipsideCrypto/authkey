import { useMemo, useState } from "react";

import { ethers } from "ethers";
import { usePrepareContractWrite, useContractWrite } from "wagmi"

import {
    getBadgerOrganizationAbi,
    getBadgerAbi,
    useFees,
    useIPFS,
    useIPFSImageHash,
    useIPFSMetadataHash,
    useUser
} from "@hooks";

import { IPFS_GATEWAY_URL } from "@static";

const getOrgFormTxArgs = ({ functionName, authenticatedAddress, name, symbol, imageHash, contractHash }) => {
    if (functionName === "setOrganizationURI") {
        return [IPFS_GATEWAY_URL + contractHash]
    } else if (functionName === "createOrganization") {
        const organizationStruct = {
            deployer: authenticatedAddress,
            uri: IPFS_GATEWAY_URL + imageHash,
            organizationURI: IPFS_GATEWAY_URL + contractHash,
            name,
            symbol
        }

        return [organizationStruct]
    }
}

const useOrgForm = ({ obj, image }) => {
    const fees = useFees();

    const { hash: imageHash } = useIPFSImageHash(image)

    const metadata = {
        name: obj.name,
        description: obj.description,
        image: imageHash,
        attributes: obj.attributes
    }

    const { hash: contractHash } = useIPFSMetadataHash(metadata)

    const { pinImage, pinMetadata } = useIPFS({
        image: image,
        data: metadata
    })

    const { authenticatedAddress, chain } = useUser();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const functionName = obj.ethereum_address ? "setOrganizationURI" : "createOrganization";

    const Badger = useMemo(() => {
        if (obj.ethereum_address) return getBadgerOrganizationAbi();

        return getBadgerAbi(chain.id);
    }, [functionName, chain.id]);

    const isReady = Badger && fees && !!authenticatedAddress;

    const args = getOrgFormTxArgs({
        functionName,
        authenticatedAddress,
        name: obj.name,
        symbol: obj.symbol,
        imageHash,
        contractHash
    });

    const overrides = { gasPrice: fees?.gasPrice };

    const { config, isSuccess: isPrepared } = usePrepareContractWrite({
        enabled: isReady,
        addressOrName: obj.ethereum_address || Badger.address,
        contractInterface: Badger.abi,
        functionName,
        args,
        overrides,
        onError: (e) => {
            const err = e?.error?.message || e?.data?.message || e

            throw new Error(err);
        }
    })

    const { writeAsync } = useContractWrite(config);

    const openOrgFormTx = async ({
        onError = (e) => { console.error(e) },
        onLoading = () => { },
        onSuccess = ({ config, chain, tx, receipt }) => { }
    }) => {
        try {
            setIsLoading(true);
            setIsSuccess(false);
            onLoading()

            const tx = await writeAsync()

            console.log(image, metadata)

            const [receipt, imageHash, metadataHash] = await Promise.all([
                tx.wait(),
                pinImage(image),
                pinMetadata(metadata)
            ])

            if (receipt.status === 0) throw new Error("Error submitting transaction.");

            setIsLoading(false);
            setIsSuccess(true);

            onSuccess({ config, chain, tx, receipt })
        } catch (e) {
            console.error(e);

            onError(e);
        }
    }

    return { openOrgFormTx, isPrepared, isLoading, isSuccess };
}

// Creates a badge from a cloned sash contract.
const useSetBadge = (isTxReady, contractAddress, tokenUri, badge) => {
    const BadgerOrganization = useMemo(() => getBadgerOrganizationAbi(), []);
    const [error, setError] = useState();

    let badgeObj = badge

    // This should also clean/check the addresses as well.
    badgeObj?.delegates?.forEach((delegate, index) => {
        if (typeof delegate === "object")
            badgeObj.delegates[index] = delegate.ethereum_address
        if (delegate === "")
            badgeObj.delegates.pop(index)
    })

    const args = [
        badgeObj.token_id,
        badgeObj.claimable,
        badgeObj.account_bound,
        badgeObj.signer || contractAddress, // Cannot have an empty string so we use the org as signer
        tokenUri || "0x",
        badgeObj.payment_token || [ethers.constants.HashZero, 0],
        badgeObj.delegates || [],
    ]

    const fees = useFees();
    const { config, isSuccess } = usePrepareContractWrite({
        addressOrName: contractAddress,
        contractInterface: BadgerOrganization.abi,
        functionName: "setBadge",
        args: args,
        enabled: Boolean(fees && isTxReady && tokenUri !== "0x"),
        overrides: {
            gasPrice: fees?.gasPrice,
        },
        onError(e) {
            const err = e?.error?.message || e?.data?.message || e
            setError(err);
            console.error('Error creating Badge: ', err);
        }
    })

    const { writeAsync } = useContractWrite(config);
    return { write: writeAsync, isSuccess, error };
}

// Determines which function to call based on if it is a revoke or a mint,
// if there are multiple badge ids, and if there are multiple holders.
const useManageBadgeOwnership = (isTxReady, orgAddress, ids, users, action, amounts) => {
    const BadgerOrganization = useMemo(() => getBadgerOrganizationAbi(), []);
    const [error, setError] = useState();

    // Might look a little funky but cleaner than a switch IMO.
    // If revoke is true, then we check if there is just one holder for a single revoke.
    // If ids is a single id, then we call the revoke function with multiple holders.
    // If ids is an array, then we call revoke with multiple different badges.
    // If revoke is false, same checks but for minting instead of revoke
    const revoke = action === "Revoke" ? true : false
    const functionName = revoke ?
        users.length === 1 ? "revoke" :
            typeof (ids) === "number" ? "revokeBatch" : "revokeFullBatch"
        :
        users.length === 1 ? "leaderMint" :
            typeof (ids) === "number" ? "leaderMintBatch" : "leaderMintFullBatch"

    // This should also clean/check the addresses as well.
    users.forEach((user, index) => {
        if (user === "") {
            users.pop(index)
        }
    })

    // TODO: Amounts will need to be changed to be an array for 
    // each badge. For now it's standard for just one.
    amounts = Array(users.length).fill(amounts)

    if (users.length === 1)
        users = users[0]

    const args = [
        users,
        ids,
        amounts,
    ]

    // Contracts currently have bytes data if it's a mint only, not revoke.
    if (!revoke)
        args.push("0x")

    const fees = useFees();
    const { config, isSuccess } = usePrepareContractWrite({
        addressOrName: orgAddress,
        contractInterface: BadgerOrganization.abi,
        functionName: functionName,
        args: args,
        enabled: Boolean(fees && isTxReady),
        overrides: {
            gasPrice: fees?.gasPrice,
        },
        onError(e) {
            const err = e?.error?.message || e?.data?.message || e
            setError(err);
            console.error('Error managing badge ownership: ', err);
        }
    })

    const { writeAsync } = useContractWrite(config);

    return { write: writeAsync, isSuccess, error };
}

// Changes delegates of badge(s) with id(s) from orgAddress. 
// If revoke is true then delegates are removed.
const useSetDelegates = (isTxReady, orgAddress, ids, delegates, action) => {
    const BadgerOrganization = useMemo(() => getBadgerOrganizationAbi(), []);
    const [error, setError] = useState();

    const revoke = action === "Remove Manager" ? true : false
    const isDelegateArray = Array(delegates.length).fill(!revoke);
    const functionName = typeof (ids) === "number" ? "setDelegates" : "setDelegatesBatch";

    // This should also clean/check the addresses as well.
    delegates.forEach((delegate, index) => {
        if (delegate === "") {
            delegates.pop(index)
        }
    })

    const args = [
        ids,
        delegates,
        isDelegateArray,
    ]

    const fees = useFees();
    const { config, isSuccess } = usePrepareContractWrite({
        addressOrName: orgAddress,
        contractInterface: BadgerOrganization.abi,
        functionName: functionName,
        args: args,
        enabled: Boolean(fees && isTxReady),
        overrides: {
            gasPrice: fees?.gasPrice,
        },
        onError(e) {
            const err = e?.error?.message || e?.data?.message || e
            setError(err);
            console.error('Error setting delegates: ', err);
        }
    })

    const { writeAsync } = useContractWrite(config);

    return { write: writeAsync, isSuccess, error };
}

// Transfer the ownership of an organization to a new address.
const useTransferOwnership = (isTxReady, orgAddress, newOwner) => {
    const BadgerOrganization = useMemo(() => getBadgerOrganizationAbi(), []);
    const [error, setError] = useState();

    const args = [
        newOwner,
    ]

    const fees = useFees();
    const { config, isSuccess } = usePrepareContractWrite({
        addressOrName: orgAddress,
        contractInterface: BadgerOrganization.abi,
        functionName: "transferOwnership",
        args: args,
        enabled: Boolean(fees && isTxReady),
        overrides: {
            gasPrice: fees?.gasPrice,
        },
        onError(e) {
            const err = e?.error?.message || e?.data?.message || e
            setError(err);
            console.error('Error transferring ownership: ', err);
        }
    })

    const { writeAsync } = useContractWrite(config);

    return { write: writeAsync, isSuccess, error };
}

// Transfer the ownership of a badge to a new address.
// TODO: This should be changed to support the intended functionality of withdrawing all assets from the org.
const useRenounceOwnership = (isTxReady, orgAddress) => {
    const BadgerOrganization = useMemo(() => getBadgerOrganizationAbi(), []);
    const [error, setError] = useState();

    const fees = useFees();
    const { config, isSuccess } = usePrepareContractWrite({
        addressOrName: orgAddress,
        contractInterface: BadgerOrganization.abi,
        functionName: "renounceOwnership",
        args: [],
        enabled: Boolean(fees && isTxReady),
        overrides: {
            gasPrice: fees?.gasPrice,
        },
        onError(e) {
            const err = e?.error?.message || e?.data?.message || e
            setError(err);
            console.error('Error transferring ownership: ', err);
        }
    })

    const { writeAsync } = useContractWrite(config);

    return { write: writeAsync, isSuccess, error };
}

export {
    useOrgForm,
    useSetBadge,
    useManageBadgeOwnership,
    useSetDelegates,
    useTransferOwnership,
    useRenounceOwnership,
}