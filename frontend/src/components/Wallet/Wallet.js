import { AuthenticationContextProvider } from '@contexts'
import {
	getDefaultWallets,
	lightTheme,
	RainbowKitProvider
} from '@rainbow-me/rainbowkit'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { localhost, polygon } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'

const Wallet = ({ children }) => {
	const { chains, provider } = configureChains(
		[polygon, localhost],
		[
			alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY }),
			publicProvider()
		]
	)

	const { connectors } = getDefaultWallets({
		appName: 'Badger',
		chains
	})

	const wagmiClient = createClient({
		autoConnect: true,
		connectors,
		provider
	})

	return (
		<WagmiConfig client={wagmiClient}>
			<RainbowKitProvider
				chains={chains}
				modalSize="compact"
				theme={lightTheme({
					accentColor: '#00FFE0',
					accentColorForeground: 'white',
					overlayBlur: 'small',
					borderRadius: 'small',
					fontStack: 'rounded'
				})}
			>
				<AuthenticationContextProvider>
					{children}
				</AuthenticationContextProvider>
			</RainbowKitProvider>
		</WagmiConfig>
	)
}

export { Wallet }
