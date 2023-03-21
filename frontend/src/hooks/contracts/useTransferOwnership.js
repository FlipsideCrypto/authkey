import { useParams } from "react-router-dom";

import { useMemo, useState } from "react";

import { usePrepareContractWrite, useContractWrite } from "wagmi"

import {
    getBadgerOrganizationAbi,
    useFees,
    useUser
} from "@hooks";

import { addressValidator } from "@utils";

import { ethers } from "ethers";

const getTransferOwnershipArgs = ({ address }) => {
    const { cleanedAddresses } = addressValidator([address]);
    const newAddress = cleanedAddresses[0];

    if (!newAddress) 
        return { functionName: "", args: [] };

    const isAddressZero = newAddress === ethers.constants.AddressZero;
    const functionName = isAddressZero ?  "renounceOwnership" : "transferOwnership";
    const args = isAddressZero ? [] : [newAddress];

    return { functionName, args };
}

const useTransferOwnership = ({ address }) => {
    const fees = useFees();

    const { orgAddress } = useParams();

    const { chain } = useUser();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const BadgerOrg = useMemo(() => { return getBadgerOrganizationAbi() }, []);

    const { functionName, args } = getTransferOwnershipArgs({ address });

    const isReady = BadgerOrg && fees && !!args;

    const overrides = { gasPrice: fees?.gasPrice };

    const { config, isSuccess: isPrepared } = usePrepareContractWrite({
        enabled: isReady,
        address: orgAddress,
        abi: BadgerOrg.abi,
        functionName: functionName,
        chainId: chain.id,
        args,
        overrides,
        onError: (e) => {
            const err = e?.error?.message || e?.data?.message || e
            throw new Error(err);
        }
    });

    console.log('transfer', config)

    const { writeAsync } = useContractWrite(config);

    const openTransferOwnershipTransaction = async ({
        onError = (e) => { console.error(e) },
        onLoading = () => { },
        onSuccess = ({ config, chain, tx, receipt }) => { }
    }) => {
        try {
            setIsLoading(true);
            setIsSuccess(false);
            onLoading();

            const tx = await writeAsync();

            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Error submitting transaction");

            receipt.events = receipt.logs.filter((log) => log.address === orgAddress).map((log) => BadgerOrg.abi.parseLog(log))

            setIsLoading(false)
            setIsSuccess(true)

            onSuccess({ config, chain, tx, receipt })
        } catch (e) {
            onError(e);
        }
    }

    return { openTransferOwnershipTransaction, isPrepared, isLoading, isSuccess }
}

export {
    useTransferOwnership
}