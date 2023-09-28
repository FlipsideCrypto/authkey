import { useMemo } from 'react'

import { Card, ChainIcon, ImageLoader } from '@components'
import { handleImageLoad } from '@hooks'
import { useNavigateAddress } from '@hooks'
import '@style/Card/OrgCard.css'
import { formatName, sliceAddress } from '@utils'

const OrgCard = ({ org }) => {
	const navigate = useNavigateAddress()

	return (
		<Card
			onClick={() =>
				navigate(
					`/dashboard/organization/${org.chain_id}/${org.ethereum_address}`
				)
			}
		>
			<div className="text">
				<h2 className="title">
					<div className="viewImage__container">
						<ImageLoader
							className="viewImage"
							bypassed={true}
							prependGateway={true}
							src={org.image_hash}
							onLoad={handleImageLoad}
						/>
						<ChainIcon chainId={org.chain_id} />
					</div>

					<span>{org.name}</span>
				</h2>

				<p className="description">
					{org.description.slice(0, 180)}{' '}
					{org.description.length > 180 ? '...' : ''}
				</p>
			</div>
		</Card>
	)
}

export { OrgCard }
