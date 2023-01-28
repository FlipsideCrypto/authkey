import { useNavigate } from "react-router-dom";

import { handleImageLoad } from "@hooks";

import { Card, ChainIcon, ImageLoader } from "@components";

import { IPFS_GATEWAY_URL } from "@static";

import { sliceAddress } from "@utils";

import "@style/Card/OrgCard.css"

const OrgCard = ({ org }) => {
    const navigate = useNavigate();

    return (
        <Card onClick={() => navigate(`/dashboard/organization/${org.id}`)}>
            <div className="text">
                <div className="subtext">
                    <ChainIcon chain={org.chain} />
                    <strong>{sliceAddress(org.ethereum_address)}</strong>
                </div>

                <h2 className="title">
                    <ImageLoader className="viewImage"
                        src={IPFS_GATEWAY_URL + org.image_hash}
                        onLoad={handleImageLoad} />

                    {org.name}
                </h2>
            </div>
        </Card>
    )
}

export { OrgCard }