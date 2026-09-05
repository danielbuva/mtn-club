'use client'

import { ChoiceCards } from '@/components/forms/choice-cards'
import { NumberStepper, TextField } from '@/components/forms/fields'
import { FormActions } from '@/components/forms/form-actions'
import {
  FormMessage,
  FormProgress,
  FormShell,
  FormStep,
} from '@/components/forms/form-shell'
import { FormViewport } from '@/components/forms/form-viewport'
import { Button } from '@/components/ui/button'
import {
  type RegistrationFlowProps,
  useRegistrationFlow,
} from '@/lib/registration/use-registration-flow'
import { GuidedQuestion } from './guided-question'
import { JoiningPreferences } from './joining-preferences'
import { RegistrationExit } from './registration-exit'
import { RegistrationReview } from './registration-review'
import { TransportationFields } from './transportation-fields'
import { WaiverFields } from './waiver-fields'

export function RegistrationFlow(props: RegistrationFlowProps) {
  const {
    data: { snapshot, values, age, errors },
    feedback: { message, failed, pending, complete },
    actions: { update, setAge, setComplete, persist, advance },
    navigation: nav,
    root,
  } = useRegistrationFlow(props)
  const question = snapshot.questions.find(
    question => nav.current === `question:${question.id}`,
  )
  const titles: Record<string, string> = {
    age: 'First, a quick age check.',
    transportation: 'How are you getting there?',
    seats: 'Sweet — how many people can you take?',
    emergency: 'Emergency Contact',
    waiver: 'Take a moment to read this.',
    preferences: 'Make yourself comfortable.',
    review: 'Everything look right?',
  }
  const title = question?.label ?? titles[nav.current] ?? 'Your trip details'
  const contactFields = ['name', 'relationship', 'phone', 'notes'] as const
  return (
    <FormShell
      ref={root}
      className="relative min-h-[65svh]"
      onSubmit={async event => {
        event.preventDefault()
        await advance()
      }}
    >
      <h1 className="pr-14 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {snapshot.title}
      </h1>
      {props.onCancel && (
        <RegistrationExit
          onCancel={props.onCancel}
          onSave={
            snapshot.actions.includes('save_draft')
              ? () => persist('draft')
              : undefined
          }
          disabled={pending}
          saveError={failed ? message : undefined}
        />
      )}
      <FormProgress index={nav.index} count={nav.count} />
      <FormMessage error={failed}>{message}</FormMessage>
      {complete ? (
        <FormStep
          title={
            snapshot.state === 'waitlisted'
              ? 'You’re on the list.'
              : 'You’re all set.'
          }
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setComplete(false)
              nav.goTo('review')
            }}
          >
            Review your answers
          </Button>
        </FormStep>
      ) : (
        <>
          <fieldset disabled={pending} className="min-w-0">
            <FormViewport stepId={nav.current} direction={nav.direction}>
              <FormStep
                title={title}
                optional={
                  nav.current === 'transportation' ||
                  Boolean(question && !question.required)
                }
                description={
                  nav.current === 'age'
                    ? 'This is saved to your account and will not be asked again. You can see it in Account settings.'
                    : nav.current === 'transportation'
                      ? 'Share your plans with the trip organizers. Rides are coordinated separately.'
                      : nav.current === 'emergency'
                        ? 'These details are shared only with authorized organizers for this trip.'
                        : nav.current === 'review'
                          ? 'Check your answers before you confirm.'
                          : undefined
                }
              >
                {nav.current === 'age' && (
                  <ChoiceCards
                    label="Age declaration"
                    error={errors.age}
                    value={age}
                    onChange={setAge}
                    options={[
                      { value: 'adult', label: 'I am 18 or older' },
                      {
                        value: 'minor',
                        label: 'I am under 18',
                        description:
                          'An officer will need to verify guardian consent.',
                      },
                    ]}
                  />
                )}
                {question && (
                  <GuidedQuestion
                    question={question}
                    value={values.answers[question.id]}
                    error={errors[`answers.${question.id}`]}
                    onChange={value =>
                      update('answers', {
                        ...values.answers,
                        [question.id]: value,
                      })
                    }
                  />
                )}
                {nav.current === 'transportation' && (
                  <TransportationFields
                    value={values.transportationMode}
                    onChange={value => update('transportationMode', value)}
                  />
                )}
                {nav.current === 'seats' && (
                  <NumberStepper
                    label="Available passenger seats"
                    value={values.seatsOffered}
                    onChange={value => update('seatsOffered', value)}
                    error={errors.seatsOffered}
                  />
                )}
                {nav.current === 'emergency' && (
                  <div className="space-y-5">
                    {contactFields.map(field => (
                      <TextField
                        key={field}
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        optional={
                          !snapshot.emergencyRequired || field === 'notes'
                        }
                        type={field === 'phone' ? 'tel' : 'text'}
                        inputMode={field === 'phone' ? 'tel' : undefined}
                        autoComplete="off"
                        value={values.emergencyContact[field]}
                        error={errors[`emergencyContact.${field}`]}
                        maxLength={
                          field === 'phone'
                            ? 50
                            : field === 'notes'
                              ? 1000
                              : 200
                        }
                        onChange={event => {
                          update('emergencyContact', {
                            ...values.emergencyContact,
                            [field]: event.target.value,
                          })
                          update('emergencyConfirmed', false)
                        }}
                      />
                    ))}
                    {snapshot.emergencyRequired && (
                      <div className="min-h-20">
                        <label className="flex min-h-12 items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-6"
                            checked={values.emergencyConfirmed}
                            aria-invalid={Boolean(errors.emergencyConfirmed)}
                            aria-describedby="emergency-confirmed-error"
                            onChange={event =>
                              update('emergencyConfirmed', event.target.checked)
                            }
                          />
                          I confirm this emergency contact is current for this
                          trip.
                        </label>
                        <p
                          id="emergency-confirmed-error"
                          role={errors.emergencyConfirmed ? 'alert' : undefined}
                          className="min-h-5 text-sm text-destructive"
                        >
                          {errors.emergencyConfirmed}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {nav.current === 'waiver' && (
                  <WaiverFields
                    hasRead={values.waiverReadId === snapshot.waiver?.id}
                    onRead={() =>
                      update('waiverReadId', snapshot.waiver?.id ?? null)
                    }
                    snapshot={snapshot}
                    agreed={values.waiverAgreed}
                    onAgree={value => update('waiverAgreed', value)}
                    signature={values.signatureName}
                    onSignature={value => update('signatureName', value)}
                    details={values.signerDetails}
                    onDetails={value => update('signerDetails', value)}
                    errors={errors}
                  />
                )}
                {nav.current === 'preferences' && (
                  <JoiningPreferences
                    showInAttendeeList={values.showInAttendeeList}
                    emailUpdates={values.emailUpdates}
                    emailAllowed={snapshot.emailAllowed}
                    onVisibilityChange={value =>
                      update('showInAttendeeList', value)
                    }
                    onEmailChange={value => update('emailUpdates', value)}
                  />
                )}
                {nav.current === 'review' && (
                  <RegistrationReview
                    snapshot={snapshot}
                    values={values}
                    onEdit={nav.goTo}
                  />
                )}
              </FormStep>
            </FormViewport>
          </fieldset>
          {nav.isLast &&
            !props.reviewNotice &&
            snapshot.eligibilityReasons.length > 0 && (
              <FormMessage error>
                {snapshot.eligibilityReasons.join(' ')}
              </FormMessage>
            )}
          {nav.isLast && props.reviewNotice}
          <FormActions
            onBack={nav.index > 0 ? nav.back : undefined}
            placement={
              ['transportation', 'seats', 'age'].includes(nav.current) ||
              (question && question.type !== 'text')
                ? 'sticky'
                : 'inline'
            }
            pending={pending}
            disabled={
              nav.isLast &&
              !snapshot.actions.includes('update_response') &&
              (!snapshot.actions.includes('register') ||
                snapshot.eligibilityReasons.length > 0)
            }
            primaryLabel={
              nav.isLast
                ? snapshot.actions.includes('update_response')
                  ? 'Save registration details'
                  : snapshot.availability === 'waitlist'
                    ? 'Join waitlist'
                    : 'Confirm Going'
                : 'Continue'
            }
            secondary={
              <>
                {nav.current === 'transportation' && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      update('transportationMode', null)
                      nav.goTo('emergency')
                    }}
                  >
                    Skip for now
                  </Button>
                )}
                {snapshot.actions.includes('save_draft') && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => persist('draft')}
                  >
                    Save and finish later
                  </Button>
                )}
              </>
            }
          />
        </>
      )}
    </FormShell>
  )
}
