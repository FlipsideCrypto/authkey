import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
	DashboardLoader,
	FormActionBar,
	FormDrawer,
	Header,
	initialOrgForm,
	Input,
	OrgDangerZone,
	SEO
} from '@components'
import {
	useDebounce,
	useIPFS,
	useIPFSImageHash,
	useIPFSMetadataHash,
	useOrgForm,
	usePFP,
	useUser
} from '@hooks'
import { IPFS_GATEWAY_URL } from '@static'
import '@style/pages/OrgForm.css'

// TODO: OrgDangerZone is a landmine that I am not yet ready to mount.

const OrgFormContent = ({
	chainId,
	address,
	orgAddress,
	organization,
	isEdit
}) => {
	const imageInput = useRef()

	const navigate = useNavigate()

	const [obj, setObj] = useState((isEdit && organization) || initialOrgForm)

	const [image, setImage] = useState(null)

	const name = useDebounce(obj.name, 300)

	const description = useDebounce(obj.description, 300)

	const { pfp } = usePFP({ name, address })

	const shouldUseHash =
		obj.image_hash && (!isEdit || (isEdit && name === organization?.name))

	const activeImage = image || (shouldUseHash && obj.image_hash) || pfp

	const { imageHash, ipfsImage } = useIPFSImageHash(activeImage)

	const { metadataHash, ipfsMetadata } = useIPFSMetadataHash({
		name: name,
		description: description,
		image: imageHash,
		attributes: obj.attributes
	})

	const { openOrgFormTx, isPrepared, isLoading } = useOrgForm({
		...obj,
		name: name,
		imageHash: imageHash,
		contractHash: metadataHash
	})

	const { pinImage, pinMetadata } = useIPFS({
		image: ipfsImage,
		data: ipfsMetadata
	})

	const activeImageObj = useMemo(() => {
		if (image)
			return {
				url: URL.createObjectURL(image),
				name: image.name
			}

		if (shouldUseHash)
			return {
				url: IPFS_GATEWAY_URL + obj.image_hash,
				name: IPFS_GATEWAY_URL + obj.image_hash
			}

		if (pfp && pfp.name)
			return {
				url: URL.createObjectURL(pfp),
				name: 'Upload custom image...'
			}

		return { url: null, name: 'Upload custom image...' }
	}, [image, shouldUseHash, obj.image_hash, pfp])

	const isDisabled = useMemo(() => {
		const isDebouncing =
			name !== obj.name || description !== obj.description

		return isDebouncing || !(name && description && activeImage)
	}, [name, description, activeImage, obj.name, obj.description])

	const actions = [
		{
			text: `${isEdit ? 'Update' : 'Create'} Organization`,
			loading: isLoading,
			disabled: isDisabled || !isPrepared,
			event: () =>
				openOrgFormTx({
					onLoading: () => {
						pinImage()
						pinMetadata()
					},
					onSuccess: ({ chain, receipt }) => {
						if (orgAddress)
							return navigate(
								`/dashboard/organization/${chainId}/${orgAddress}/`
							)

						const event = receipt.events.find(
							event => event.name === 'OrganizationCreated'
						)

						if (!event)
							throw new Error('Error submitting transaction.')

						navigate(
							`/dashboard/organization/${chain.id}/${event.args.organization}/`
						)
					}
				})
		}
	]

	const onNameChange = e => {
		setObj({ ...obj, name: e.target.value })
	}

	const onDescriptionChange = e => {
		setObj({ ...obj, description: e.target.value })
	}

	const onImageChange = e => {
		const file = e.target.files[0]

		if (!file) return

		setImage(file)
	}

	return (
		<>
			<div className="dashboard__content">
				<h2>{`${isEdit ? 'Update' : 'Create'} Organization`}</h2>
			</div>

			<FormDrawer label="Information">
				<Input
					label="Name"
					value={obj.name || ''}
					onChange={onNameChange}
				/>
				<Input
					label="Description"
					value={obj.description || ''}
					onChange={onDescriptionChange}
				/>
			</FormDrawer>

			<FormDrawer label="Advanced" open={!!obj.image_hash}>
				<Input
					name="Custom Image"
					label="Custom Image"
					accept="image/*"
					required={false}
					disabled={true}
					value={activeImageObj.name}
					append={
						<button
							className="secondary"
							onClick={() => imageInput.current.click()}
							style={{ width: 'auto' }}
						>
							<span>{obj.image_hash ? 'Change' : 'Upload'}</span>
						</button>
					}
				/>

				<input
					id="org-image"
					style={{ display: 'none' }}
					ref={imageInput}
					accept="image/*"
					type="file"
					onChange={onImageChange}
				/>
			</FormDrawer>

			<FormActionBar
				className={(!isEdit && 'actionFixed') || 'full'}
				actions={actions}
			/>

			{isEdit && <OrgDangerZone />}
		</>
	)
}

const OrgForm = ({ isEdit = false }) => {
	const navigate = useNavigate()

	const { chainId, orgAddress } = useParams()

	const { address, organization, canManage, retrieve } = useUser({
		chainId,
		orgAddress
	})

	return (
		<>
			<SEO
				title={`${isEdit ? 'Update' : 'Create'} Organization // Badger`}
			/>

			<Header
				back={() =>
					navigate(
						isEdit
							? `/dashboard/organization/${chainId}/${organization.ethereum_address}/`
							: '/dashboard/'
					)
				}
			/>

			<DashboardLoader
				chainId={chainId}
				orgAddress={orgAddress}
				obj={!isEdit ? { name: '' } : organization}
				retrieve={retrieve}
				managed={isEdit}
				canManage={canManage}
			>
				<OrgFormContent
					chainId={chainId}
					address={address}
					orgAddress={orgAddress}
					organization={organization}
					isEdit={isEdit}
				/>
			</DashboardLoader>
		</>
	)
}

export { OrgForm }
