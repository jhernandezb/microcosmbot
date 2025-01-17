// @flow
import * as React from 'react'
import { Formik } from 'formik'
import { GroupTokenGate } from '@microcosms/db'
import { GetRuleOutput } from 'utils/types'
import { toFormikValidate } from 'zod-formik-adapter'
import { z } from 'zod'
import { zodStarsContractAddress } from 'libs/stars'
import { trpc } from 'utils/trpc'
import { useCloseModal } from 'state/hooks'
import { useInvalidateCode } from 'utils/trpc/invalidate'
import { useMutation } from '@tanstack/react-query'

type Props = {
  rule?: GroupTokenGate
  manageGroup: GetRuleOutput
  onSave: () => Promise<void>
}

const positiveIntegerOrEmptyString = z.union([
  z
    .string()
    .refine((n) => {
      const int = parseInt(n)
      return int > 0 && Number.isInteger(int)
    }, 'must be an positive integer')
    .transform((n) => parseInt(n)),
  z.string().length(0),
])

const Schema = z
  .object({
    name: z.string().max(128),
    contractAddress: zodStarsContractAddress,
    minTokens: positiveIntegerOrEmptyString,
    maxTokens: positiveIntegerOrEmptyString,
  })
  .refine((data) => {
    if (data.minTokens && data.maxTokens) {
      return (
        parseInt(data.minTokens.toString()) <
        parseInt(data.maxTokens.toString())
      )
    }
    return true
  }, 'refined')
export const EditOrCreateGroupTokenGateView = ({
  rule,
  manageGroup,
  onSave,
}: Props) => {
  const { closeModal } = useCloseModal()
  const saveRule = trpc.manageGroup.saveRule.useMutation()
  const deleteRule = trpc.manageGroup.deleteRule.useMutation()
  const onDeleteRule = useMutation(async () => {
    if (!rule) return
    await deleteRule.mutateAsync({ id: rule.id, code: manageGroup.code })
    await invalidate()
    await onSave()
    closeModal()
  })

  const { invalidate } = useInvalidateCode()
  const initalizeValues = {
    name: rule?.name || '',
    contractAddress: rule?.contractAddress || '',
    minTokens:
      typeof rule?.minTokens !== 'number' ? '' : rule.minTokens.toString(),
    maxTokens:
      typeof rule?.maxTokens !== 'number' ? '' : rule?.maxTokens.toString(),
  }
  console.log('initalizeValues', initalizeValues)
  return (
    <div className="space-y-10 divide-y divide-gray-900/10">
      <div className="bg-gray-100 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <div className="px-4 py-4 sm:px-3 sm:py-3">
          <h2 className="text-base text-xl font-semibold leading-7 text-gray-900">
            Access Rule
          </h2>
          <p className="mt-1 text-sm leading-6 text-body1 text-gray-600">
            {rule && 'Configure an access rule'}
            {!rule && 'Create an access rule'}
          </p>
        </div>
        <Formik
          initialValues={initalizeValues}
          validate={toFormikValidate(Schema)}
          onSubmit={async (values, { setSubmitting }) => {
            console.log('submitted valued', values)
            try {
              await saveRule.mutateAsync({
                id: rule?.id,
                code: manageGroup.code,
                updates: {
                  ...values,
                  minToken: parseInt(values.minTokens.toString()),
                  maxToken: values.maxTokens
                    ? parseInt(values.maxTokens.toString())
                    : null,
                },
              })
            } catch (e) {
              //error uhhh what
            }
            await invalidate()
            await onSave()
            setSubmitting(false)
            closeModal()

            // setTimeout(() => {
            //   alert(JSON.stringify(values, null, 2))
            //   setSubmitting(false)
            // }, 1)
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            /* and other goodies */
          }) => (
            <form
              onSubmit={(e) => {
                handleSubmit(e)
              }}
              className="text-body1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
            >
              <div className="px-4 py-6 sm:p-8">
                <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Access Rule Name
                    </label>
                    <div className="mt-2">
                      <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        {/*<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">*/}
                        {/*  http://*/}
                        {/*</span>*/}
                        <input
                          type="text"
                          name="name"
                          id="name"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.name}
                          className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                        <span className={'text-red-400'}>
                          {errors.name && touched.name && errors.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <label
                      htmlFor="contractAddress"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      NFT Contract Address
                    </label>
                    <div className="mt-2">
                      <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        {/*<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">*/}
                        {/*  http://*/}
                        {/*</span>*/}
                        <input
                          type="text"
                          name="contractAddress"
                          id="contractAddress"
                          className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                          placeholder="stars..."
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.contractAddress}
                        />
                      </div>{' '}
                      <span className={'text-red-400'}>
                        {errors.contractAddress &&
                          touched.contractAddress &&
                          errors.contractAddress}
                      </span>
                    </div>
                  </div>

                  {/*<div className="col-span-full">*/}
                  {/*  <label*/}
                  {/*    htmlFor="about"*/}
                  {/*    className="block text-sm font-medium leading-6 text-gray-900"*/}
                  {/*  >*/}
                  {/*    About*/}
                  {/*  </label>*/}
                  {/*  <div className="mt-2">*/}
                  {/*    <textarea*/}
                  {/*      id="about"*/}
                  {/*      name="about"*/}
                  {/*      rows={3}*/}
                  {/*      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
                  {/*      defaultValue={''}*/}
                  {/*    />*/}
                  {/*  </div>*/}
                  {/*  <p className="mt-3 text-sm leading-6 text-gray-600">*/}
                  {/*    Write a few sentences about yourself.*/}
                  {/*  </p>*/}
                  {/*</div>*/}

                  {/*<div className="col-span-full">*/}
                  {/*  <label*/}
                  {/*    htmlFor="photo"*/}
                  {/*    className="block text-sm font-medium leading-6 text-gray-900"*/}
                  {/*  >*/}
                  {/*    Photo*/}
                  {/*  </label>*/}
                  {/*  <div className="mt-2 flex items-center gap-x-3">*/}
                  {/*    <button*/}
                  {/*      type="button"*/}
                  {/*      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"*/}
                  {/*    >*/}
                  {/*      Change*/}
                  {/*    </button>*/}
                  {/*  </div>*/}
                  {/*</div>*/}

                  {/*<div className="col-span-full">*/}
                  {/*  <label*/}
                  {/*    htmlFor="cover-photo"*/}
                  {/*    className="block text-sm font-medium leading-6 text-gray-900"*/}
                  {/*  >*/}
                  {/*    Cover photo*/}
                  {/*  </label>*/}
                  {/*  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">*/}
                  {/*    <div className="text-center">*/}
                  {/*      <div className="mt-4 flex text-sm leading-6 text-gray-600">*/}
                  {/*        <label*/}
                  {/*          htmlFor="file-upload"*/}
                  {/*          className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"*/}
                  {/*        >*/}
                  {/*          <span>Upload a file</span>*/}
                  {/*          <input*/}
                  {/*            id="file-upload"*/}
                  {/*            name="file-upload"*/}
                  {/*            type="file"*/}
                  {/*            className="sr-only"*/}
                  {/*          />*/}
                  {/*        </label>*/}
                  {/*        <p className="pl-1">or drag and drop</p>*/}
                  {/*      </div>*/}
                  {/*      <p className="text-xs leading-5 text-gray-600">*/}
                  {/*        PNG, JPG, GIF up to 10MB*/}
                  {/*      </p>*/}
                  {/*    </div>*/}
                  {/*  </div>*/}
                  {/*</div>*/}
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="minTokens"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Minimum Tokens
                    </label>
                    <div className="mt-2">
                      <input
                        // type="number"
                        min={1}
                        name="minTokens"
                        id="minTokens"
                        autoComplete="minTokens"
                        className="block w-full bg-transparent rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.minTokens || ''}
                      />
                    </div>
                    <span className={'text-red-400'}>
                      {errors.minTokens &&
                        touched.minTokens &&
                        errors.minTokens}
                    </span>
                  </div>
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="maxTokens"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Maximum Tokens (optional)
                    </label>
                    <div className="mt-2">
                      <input
                        // type="number"
                        name="maxTokens"
                        id="maxTokens"
                        autoComplete="maxTokens"
                        className="block w-full bg-transparent rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.maxTokens || ''}
                      />
                    </div>
                    <span className={'text-red-400'}>
                      {errors.maxTokens &&
                        touched.maxTokens &&
                        errors.maxTokens}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                {rule && (
                  <button
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    disabled={isSubmitting || onDeleteRule.isLoading}
                    onClick={(e) => {
                      e.preventDefault()
                      onDeleteRule.mutate()
                    }}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold leading-6 text-gray-900"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  disabled={isSubmitting || onDeleteRule.isLoading}
                  // onClick={() => handleSubmit()}
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>

      {/*<div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">*/}
      {/*  <div className="px-4 sm:px-0">*/}
      {/*    <h2 className="text-base font-semibold leading-7 text-gray-900">*/}
      {/*      Personal Information*/}
      {/*    </h2>*/}
      {/*    <p className="mt-1 text-sm leading-6 text-gray-600">*/}
      {/*      Use a permanent address where you can receive mail.*/}
      {/*    </p>*/}
      {/*  </div>*/}

      {/*  <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">*/}
      {/*    <div className="px-4 py-6 sm:p-8">*/}
      {/*      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">*/}
      {/*        <div className="sm:col-span-3">*/}
      {/*          <label*/}
      {/*            htmlFor="first-name"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            First name*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="first-name"*/}
      {/*              id="first-name"*/}
      {/*              autoComplete="given-name"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-3">*/}
      {/*          <label*/}
      {/*            htmlFor="last-name"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            Last name*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="last-name"*/}
      {/*              id="last-name"*/}
      {/*              autoComplete="family-name"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-4">*/}
      {/*          <label*/}
      {/*            htmlFor="email"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            Email address*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              id="email"*/}
      {/*              name="email"*/}
      {/*              type="email"*/}
      {/*              autoComplete="email"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-4">*/}
      {/*          <label*/}
      {/*            htmlFor="country"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            Country*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <select*/}
      {/*              id="country"*/}
      {/*              name="country"*/}
      {/*              autoComplete="country-name"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"*/}
      {/*            >*/}
      {/*              <option>United States</option>*/}
      {/*              <option>Canada</option>*/}
      {/*              <option>Mexico</option>*/}
      {/*            </select>*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="col-span-full">*/}
      {/*          <label*/}
      {/*            htmlFor="street-address"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            Street address*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="street-address"*/}
      {/*              id="street-address"*/}
      {/*              autoComplete="street-address"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-2 sm:col-start-1">*/}
      {/*          <label*/}
      {/*            htmlFor="city"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            City*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="city"*/}
      {/*              id="city"*/}
      {/*              autoComplete="address-level2"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-2">*/}
      {/*          <label*/}
      {/*            htmlFor="region"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            State / Province*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="region"*/}
      {/*              id="region"*/}
      {/*              autoComplete="address-level1"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        <div className="sm:col-span-2">*/}
      {/*          <label*/}
      {/*            htmlFor="postal-code"*/}
      {/*            className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*          >*/}
      {/*            ZIP / Postal code*/}
      {/*          </label>*/}
      {/*          <div className="mt-2">*/}
      {/*            <input*/}
      {/*              type="text"*/}
      {/*              name="postal-code"*/}
      {/*              id="postal-code"*/}
      {/*              autoComplete="postal-code"*/}
      {/*              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
      {/*            />*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">*/}
      {/*      <button*/}
      {/*        type="button"*/}
      {/*        className="text-sm font-semibold leading-6 text-gray-900"*/}
      {/*      >*/}
      {/*        Cancel*/}
      {/*      </button>*/}
      {/*      <button*/}
      {/*        type="submit"*/}
      {/*        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"*/}
      {/*      >*/}
      {/*        Save*/}
      {/*      </button>*/}
      {/*    </div>*/}
      {/*  </form>*/}
      {/*</div>*/}

      {/*<div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">*/}
      {/*  <div className="px-4 sm:px-0">*/}
      {/*    <h2 className="text-base font-semibold leading-7 text-gray-900">*/}
      {/*      Notifications*/}
      {/*    </h2>*/}
      {/*    <p className="mt-1 text-sm leading-6 text-gray-600">*/}
      {/*      Well always let you know about important changes, but you pick what*/}
      {/*      else you want to hear about.*/}
      {/*    </p>*/}
      {/*  </div>*/}

      {/*  <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">*/}
      {/*    <div className="px-4 py-6 sm:p-8">*/}
      {/*      <div className="max-w-2xl space-y-10">*/}
      {/*        <fieldset>*/}
      {/*          <legend className="text-sm font-semibold leading-6 text-gray-900">*/}
      {/*            By Email*/}
      {/*          </legend>*/}
      {/*          <div className="mt-6 space-y-6">*/}
      {/*            <div className="relative flex gap-x-3">*/}
      {/*              <div className="flex h-6 items-center">*/}
      {/*                <input*/}
      {/*                  id="comments"*/}
      {/*                  name="comments"*/}
      {/*                  type="checkbox"*/}
      {/*                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*                />*/}
      {/*              </div>*/}
      {/*              <div className="text-sm leading-6">*/}
      {/*                <label*/}
      {/*                  htmlFor="comments"*/}
      {/*                  className="font-medium text-gray-900"*/}
      {/*                >*/}
      {/*                  Comments*/}
      {/*                </label>*/}
      {/*                <p className="text-gray-500">*/}
      {/*                  Get notified when someones posts a comment on a posting.*/}
      {/*                </p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="relative flex gap-x-3">*/}
      {/*              <div className="flex h-6 items-center">*/}
      {/*                <input*/}
      {/*                  id="candidates"*/}
      {/*                  name="candidates"*/}
      {/*                  type="checkbox"*/}
      {/*                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*                />*/}
      {/*              </div>*/}
      {/*              <div className="text-sm leading-6">*/}
      {/*                <label*/}
      {/*                  htmlFor="candidates"*/}
      {/*                  className="font-medium text-gray-900"*/}
      {/*                >*/}
      {/*                  Candidates*/}
      {/*                </label>*/}
      {/*                <p className="text-gray-500">*/}
      {/*                  Get notified when a candidate applies for a job.*/}
      {/*                </p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="relative flex gap-x-3">*/}
      {/*              <div className="flex h-6 items-center">*/}
      {/*                <input*/}
      {/*                  id="offers"*/}
      {/*                  name="offers"*/}
      {/*                  type="checkbox"*/}
      {/*                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*                />*/}
      {/*              </div>*/}
      {/*              <div className="text-sm leading-6">*/}
      {/*                <label*/}
      {/*                  htmlFor="offers"*/}
      {/*                  className="font-medium text-gray-900"*/}
      {/*                >*/}
      {/*                  Offers*/}
      {/*                </label>*/}
      {/*                <p className="text-gray-500">*/}
      {/*                  Get notified when a candidate accepts or rejects an*/}
      {/*                  offer.*/}
      {/*                </p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          </div>*/}
      {/*        </fieldset>*/}
      {/*        <fieldset>*/}
      {/*          <legend className="text-sm font-semibold leading-6 text-gray-900">*/}
      {/*            Push Notifications*/}
      {/*          </legend>*/}
      {/*          <p className="mt-1 text-sm leading-6 text-gray-600">*/}
      {/*            These are delivered via SMS to your mobile phone.*/}
      {/*          </p>*/}
      {/*          <div className="mt-6 space-y-6">*/}
      {/*            <div className="flex items-center gap-x-3">*/}
      {/*              <input*/}
      {/*                id="push-everything"*/}
      {/*                name="push-notifications"*/}
      {/*                type="radio"*/}
      {/*                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*              />*/}
      {/*              <label*/}
      {/*                htmlFor="push-everything"*/}
      {/*                className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*              >*/}
      {/*                Everything*/}
      {/*              </label>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-center gap-x-3">*/}
      {/*              <input*/}
      {/*                id="push-email"*/}
      {/*                name="push-notifications"*/}
      {/*                type="radio"*/}
      {/*                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*              />*/}
      {/*              <label*/}
      {/*                htmlFor="push-email"*/}
      {/*                className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*              >*/}
      {/*                Same as email*/}
      {/*              </label>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-center gap-x-3">*/}
      {/*              <input*/}
      {/*                id="push-nothing"*/}
      {/*                name="push-notifications"*/}
      {/*                type="radio"*/}
      {/*                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"*/}
      {/*              />*/}
      {/*              <label*/}
      {/*                htmlFor="push-nothing"*/}
      {/*                className="block text-sm font-medium leading-6 text-gray-900"*/}
      {/*              >*/}
      {/*                No push notifications*/}
      {/*              </label>*/}
      {/*            </div>*/}
      {/*          </div>*/}
      {/*        </fieldset>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">*/}
      {/*      <button*/}
      {/*        type="button"*/}
      {/*        className="text-sm font-semibold leading-6 text-gray-900"*/}
      {/*      >*/}
      {/*        Cancel*/}
      {/*      </button>*/}
      {/*      <button*/}
      {/*        type="submit"*/}
      {/*        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"*/}
      {/*      >*/}
      {/*        Save*/}
      {/*      </button>*/}
      {/*    </div>*/}
      {/*  </form>*/}
      {/*</div>*/}
    </div>
  )
}
