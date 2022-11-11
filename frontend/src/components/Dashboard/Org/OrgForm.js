import { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNetwork, useAccount } from "wagmi";

import { UserContext } from "@components/Dashboard/Provider/UserContextProvider";
import { OrgContext } from "@components/Dashboard/Provider/OrgContextProvider";
import { ErrorContext } from "@components/Dashboard/Provider/ErrorContextProvider";
import Header from "@components/Dashboard/Header/Header";
import ActionBar from "@components/Dashboard/Form/ActionBar";
import Input from "@components/Dashboard/Form/Input";
import FormDrawer from "@components/Dashboard/Form/FormDrawer";
import OrgDangerZone from "@components/Dashboard/Org/OrgDangerZone";

import { useCreateOrg, useEditOrg } from "@hooks/contracts/useContracts";
import { postOrgRequest, postIPFSImage, postIPFSMetadata, getPFPImage } from "@utils/api_requests";
import { getBadgerAbi } from "@hooks/contracts/contractVersions";
import { useIPFSImageHash, useIPFSMetadataHash } from "@hooks/useIpfsHash";

const OrgForm = (isEdit) => {
    const { userData, setUserData } = useContext(UserContext);
    const { orgData, setOrgData } = useContext(OrgContext);

    const { setError } = useContext(ErrorContext);
    
    const { address } = useAccount();
    const { chain } = useNetwork();
    const { orgId } = useParams();
    const navigate = useNavigate();
    const imageInput = useRef();
    
    const [ orgObj, setOrgObj ] = useState(orgData)
    const [ txPending, setTxPending ] = useState(false);
    const [ orgImage, setOrgImage ] = useState();
    const [ isCustomImage, setIsCustomImage ] = useState(orgData?.image_hash ? true : false);

    // Is the data valid for the transaction to be prepared.
    const isDisabled = useMemo(() => {
        return (
            !orgObj.name ||
            !orgObj.symbol ||
            !orgObj.description ||
            !orgImage
        )
    }, [orgObj, orgImage])
    
    // Determine the IPFS hashes before hand so the transaction can be prepared ASAP
    // without actively pinning or waiting for the hashes to be returned.
    const { hash: deterministicImageHash } = useIPFSImageHash(orgImage)
    const { hash: deterministicMetadataHash } = useIPFSMetadataHash({
        name: orgObj.name, 
        description: orgObj.description, 
        image: orgObj?.imageHash || deterministicImageHash
    })

    const createContract = useCreateOrg(
        !isDisabled && !isEdit,
        orgObj,
        deterministicImageHash,
        deterministicMetadataHash,
        address, 
        chain?.name
    )
    const updateOrg = useEditOrg(
        !isDisabled && isEdit,
        orgObj,
        deterministicImageHash,
        deterministicMetadataHash,
        address,
        chain?.name
    )
    const badger = useMemo(() => getBadgerAbi(chain?.name), [chain?.name]);

    let firstCharOfName = useRef();

    const actions = isEdit ? 
        [
            {
                text: "Create organization",
                icon: ["fal", "arrow-right"],
                loading: txPending,
                disabled: !createContract.isSuccess,
                event: () => createOrgTx()
            }
        ]
        :
        [
            {
                text: "Update organization",
                icon: ["fal", "arrow-right"],
                loading: txPending,
                disabled: !updateOrg.isSuccess,
                event: () => updateOrgTx()
            }
        ]

    // Converts an org name to a symbol.
    const nameToSymbol = (name) => {
        return name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 5);
    }

    // When name is changed, update orgObj name, and symbol if symbol is not custom.
    const onOrgNameChange = (e) => {
        setOrgObj({...orgObj, name: e.target.value, symbol: nameToSymbol(e.target.value)});
        if (
            !isCustomImage &&
            e.target.value[0] !== firstCharOfName.current
        ) {
            firstCharOfName.current = e.target.value[0];
            getGeneratedImage(firstCharOfName.current);
        }
    }

    // Custom image upload. If image gets set to null then get new generative.
    const onCustomImageUpload = async (image) => {
        // For editing, we have to clear the image_hash to switch to deterministic hashing.
        setOrgObj({...orgObj, image_hash: null});

        setIsCustomImage(image ? true : false);
        let customImage = image ? 
            image : await getPFPImage(firstCharOfName.current);
        setOrgImage(image ?? customImage);
    }

    // Get a generated image for the org.
    const getGeneratedImage = async (char) => {
        const response = await getPFPImage(char, address);
        if (response.error) {
            setError({
                label: "Error getting generated Org Image",
                message: response.error``
            })
        } else {
            setOrgImage(response);
        }
    }
    
    // Pin the org image to IPFS.
    const pinImage = async (image) => {
        const response = await postIPFSImage(image);

        if (response?.error) {
            setError({
                label: "Error uploading image to IPFS",
                message: response.error
            })
            return;
        }

        return response.hash;
    }

    // Post the IPFS metadata for the org.
    const pinMetadata = async (imageHash) => {
        const response = await postIPFSMetadata({
            name: orgObj.name, 
            description: orgObj.description, 
            imageHash: imageHash
        });

        if (response.error) {
            setError({
                label: 'Error creating Org URI',
                message: response.error
            });
            return;
        }
        
        return response.hash;
    }

    // Awaits a prepared transaction before running it.
    const createOrgTx = async () => {
        setTxPending(true);
        try {
            let tx = await createContract.write?.();
            // Await the txReceipt, image hash, and metadata hash in parallel.
            const [txReceipt, imageHash, metadataHash] = await Promise.all([
                tx.wait(),
                pinImage(orgImage),
                pinMetadata(deterministicImageHash)
            ])

            if (txReceipt.status !== 1)
                throw new Error(createContract?.error);
            // Decode the transaction receipt to get the contract address from the event.
            const orgCreatedTopic = badger.abi.getEventTopic("OrganizationCreated");
            const orgCreatedEvent = txReceipt.logs.find((log) => log.topics[0] === orgCreatedTopic);
            const orgEvent = badger.abi.decodeEventLog("OrganizationCreated", orgCreatedEvent.data, orgCreatedEvent.topics);
            const contractAddress = orgEvent.organization;

            const org = {
                ...orgObj,
                ethereum_address: contractAddress, 
                contract_uri_hash: metadataHash,
                image_hash: imageHash,
                is_active: true
            }

            // If transaction was confirmed, add is_active and contract address to orgObj.
            // Adding the ethereum address will trigger a useEffect to post to backend.
            setOrgObj(org);
            const response = await postOrg(org);
            navigate(`/dashboard/organization/${response.id}`);
        }
        catch (error) {
            setError({
                label: 'Error creating Org',
                message: error
            });
            setTxPending(false);
        }
    }

    const updateOrgTx = async () => {
        setTxPending(true);
        try {
            let tx = await updateOrg.write?.();
            // Await the txReceipt, image hash, and metadata hash in parallel.
            const [txReceipt, imageHash, metadataHash] = await Promise.all([
                tx.wait(),
                pinImage(orgImage),
                pinMetadata(deterministicImageHash)
            ])

            if (txReceipt.status !== 1)
                throw new Error(updateOrg?.error);

            const org = {
                ...orgObj,
                contract_uri_hash: metadataHash,
                image_hash: imageHash,
            }
            setOrgObj(org);
            await postOrg(org);
            // TODO: Success message!

            setTxPending(false);
        }
        catch (error) {
            setError({
                label: 'Error updating Org',
                message: error
            });
            setTxPending(false);
        }
    }

    // Post the org Obj to the backend once the contract address is added.
    const postOrg = useCallback(async (org) => {
        const response = await postOrgRequest(org);
        if (!response?.error && response?.id) {
            let newUserData = {...userData};

            if (newUserData.organizations)
                newUserData.organizations.push(response);
            else
                newUserData.organizations = [response];
    
            setUserData(newUserData);
        }
        else {
            setError({
                label: 'Could not add org to database',
                message: response.error
            });
        }

        return response;
    }, [navigate, userData, setUserData, setError]);

    // If we have a silent error from preparing the transaction, display it.
    useEffect(() => {
        setError(null);
        if (createContract?.error || updateOrg?.error) {
            setError({
                label: 'Error managing the Org',
                message: createContract?.error || updateOrg?.error
            })
        }
    }, [updateOrg.error, createContract.error, setError])

    return (
        <div id="new-org">
            <Header back={() => navigate((isEdit ? `/dashboard/organization/${orgId}` : '/dashboard'))} />

            <h2 style={{marginLeft: "30px"}}>
                {isEdit ? "Update Organization" : "Create Organization"}
            </h2>

            <FormDrawer label="General" open={true}>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "20px"}}>
                    <Input 
                        name="orgName"
                        label="Name" 
                        required={true}
                        value={orgObj?.name || ""} 
                        onChange={onOrgNameChange}
                    />

                    <Input 
                        name="orgSymbol"
                        label="Symbol" 
                        required={false}
                        value={orgObj?.symbol || ""} 
                        onChange={(e) => setOrgObj({...orgObj, symbol: e.target.value})}
                    />
                </div>

                <Input
                    name="orgDescription"
                    label="Description"
                    required={true}
                    value={orgObj?.description || ""}
                    onChange={(e) => setOrgObj({...orgObj, description: e.target.value})}
                />

                <ActionBar
                    help={
                        `You can only set the on-chain name of your Organization once. 
                        After creation, you can update the off-chain name and description 
                        but you cannot change the name of the contract. Please make sure 
                        you are happy with it before submitting.`
                    }
                    helpStyle={{maxWidth: "840px"}}
                />
            </FormDrawer>

            <FormDrawer label="Appearance" open={true}>
                <Input
                    name="Custom Image"
                    accept="image/*"
                    label="Custom Image"
                    placeholder="Upload Custom Organization Image"
                    disabled={true}
                    value={isCustomImage && orgImage?.name ? orgImage.name : "Choose file..."}
                    append={
                        <button
                            className="button-secondary"
                            onClick={() => imageInput.current.click()}
                            style={{width: "auto"}}
                        >
                            {isCustomImage ?
                                "Change image" : 
                                "Upload image"
                            }
                        </button>
                    }
                />
                    <input
                        id="org-image"
                        style={{ display: "none" }}
                        ref={imageInput}
                        accept="image/*"
                        type="file"
                        onChange={(event) => {onCustomImageUpload(event.target.files[0])}}
                    />
            </FormDrawer>

            <ActionBar 
                help={"Badge creation occurs after your organization has been established."} 
                actions={actions}
                style={{marginInline: "30px"}}
            />

            {isEdit && 
                <OrgDangerZone orgAddress={orgObj?.ethereum_address} />
            }
        </div>
    )
}

export default OrgForm;