import { Window } from '@keplr-wallet/types'
import { SigningCosmWasmClient, StdSignDoc } from 'cosmwasm'
import { buildMessage } from './build-mesage'
import { AminoSignResponse, StdSignature } from '@cosmjs/amino'
import { SignOptions } from '@cosmos-kit/core'

export const signLoginMessageWithArbitrary = async (
  otp: string,
  signArbitrary: (
    signer: string,
    data: string | Uint8Array
  ) => Promise<StdSignature>
) => {
  const keplrWindow = <Window>window
  const keplr = keplrWindow.keplr
  if (!keplr) {
    throw new Error('Keplr not installed')
  }
  const chainId = 'stargaze-1'
  const key = await keplr.getKey(chainId)

  const userAddress = key.bech32Address
  // const signature = await keplr.signArbitrary(
  //   chainId,
  //   userAddress,
  //   JSON.stringify(buildMessage(otp))
  // )
  const signature = await signArbitrary(
    userAddress,
    JSON.stringify(buildMessage(otp))
  )

  return {
    signature,
    address: userAddress,
    otp,
  }
}

export const signLoginMessageWithAmino = async (
  otp: string,
  signAmino: (
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions | undefined
  ) => Promise<AminoSignResponse>
) => {
  const keplrWindow = <Window>window
  const keplr = keplrWindow.keplr
  if (!keplr) {
    throw new Error('Keplr not installed')
  }
  const chainId = 'stargaze-1'
  const key = await keplr.getKey(chainId)

  const userAddress = key.bech32Address
  // const signature = await keplr.signArbitrary(
  //   chainId,
  //   userAddress,
  //   JSON.stringify(buildMessage(otp))
  // )
  const messageToSign = JSON.stringify(buildMessage(otp))
  const signDoc = {
    msgs: [
      {
        type: 'microcosmsbot-login',
        value: messageToSign,
      },
    ],
    fee: {
      amount: [],
      // Note: this needs to be 0 gas to comply with ADR36, but Keplr current throws an error. See: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-036-arbitrary-signature.md#decision
      gas: '1',
    },
    chain_id: chainId,
    memo: '',
    account_number: '0',
    sequence: '0',
  }
  const signature = await signAmino(userAddress, signDoc)

  return {
    signature,
    address: userAddress,
    otp,
  }
}
