import { useContext, useEffect, useState } from "react";

import { ErrorContext } from "@contexts";

import { postIPFSImage, postIPFSMetadata } from "@utils";

import { IPFS_GATEWAY_URL } from "@static"

const Hash = require("ipfs-only-hash");

const useIPFS = ({ image, data }) => {
    const { setError } = useContext(ErrorContext);

    const [imageHash, setImageHash] = useState(null);

    const useImageHash = async () => {
        console.log('inside useImageHash', image)

        if (!image) return { hash: null };

        const reader = new FileReader();

        reader.onload = async () => {
            var uint8Array = new Uint8Array(reader.result);
            await Hash.of(uint8Array, {
                cidVersion: 0,
                onlyHash: true,
            })
                .then((res) => { setImageHash(res); })
                .catch((err) => { console.error('Error with deterministic image hashing', err); })
        };

        return { hash: imageHash }
    }

    const useMetadataHash = async () => {

    }

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

    const pinMetadata = async (data) => {
        const response = await postIPFSMetadata(data);

        if (response.error) {
            setError({
                label: 'Error creating Org URI',
                message: response.error
            });
            return;
        }

        return response.hash;
    }

    return { useImageHash, useMetadataHash, pinImage, pinMetadata }
}

const useIPFSImageHash = (imageFile) => {
    const [hash, setHash] = useState(null);

    useEffect(() => {
        async function getHash(image) {
            if (!image) return;

            const reader = new FileReader();
            reader.onload = async () => {
                var uint8Array = new Uint8Array(reader.result);
                await Hash.of(uint8Array, {
                    cidVersion: 0,
                    onlyHash: true,
                })
                    .then((res) => { setHash(res); })
                    .catch((err) => { console.error('Error with deterministic image hashing', err); })
            };

            reader.readAsArrayBuffer(image);
        }

        getHash(imageFile);
    }, [imageFile])

    return { hash };
}

const useIPFSMetadataHash = (data) => {
    const [hash, setHash] = useState(null);

    useEffect(() => {
        async function getHash() {
            if (!data) return;

            const stringify = JSON.stringify({ ...data, image: IPFS_GATEWAY_URL + data.image });
            await Hash.of(stringify, { cidVersion: 0, onlyHash: true })
                .then((res) => {
                    setHash(res);
                })
                .catch((err) => {
                    console.error('Error with deterministic metadata hashing', err);
                })
        }

        getHash();
    }, [data])

    return { hash };
}

export {
    useIPFS,
    useIPFSImageHash,
    useIPFSMetadataHash
}