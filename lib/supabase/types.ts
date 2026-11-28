import type { Database as GeneratedDatabase } from './database.generated'

export type {
  CompositeTypes,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.generated'
export { Constants } from './database.generated'

type Functions = GeneratedDatabase['public']['Functions']

// PostgreSQL function arguments have no nullability metadata. Record the
// nullable arguments used by callers without weakening table or RPC types.
type NullableArgs = {
  admin_list_accounts:
    | 'p_search'
    | 'p_membership_state'
    | 'p_role_name'
    | 'p_restriction'
    | 'p_mailing'
  process_membership_checkout_event: 'p_customer_id' | 'p_receipt_url'
  publish_trip_draft: 'p_meetup_point'
  record_admin_activity: 'p_subject_user_id' | 'p_resource_id'
  review_guardian_request: 'p_reason'
  review_zelle_membership_payment: 'p_note'
  save_trip_detail_edits: 'p_meetup_point'
  set_admin_account_restriction: 'p_reason'
  set_zelle_membership_payment_status: 'p_note'
  submit_membership_signup: 'p_experience_notes'
}

type TypedFunctions = {
  [Name in keyof Functions]: Name extends keyof NullableArgs
    ? {
        Args: {
          [Arg in keyof Functions[Name]['Args']]:
            | Functions[Name]['Args'][Arg]
            | (Arg extends NullableArgs[Name] ? null : never)
        }
        Returns: Functions[Name]['Returns']
      }
    : Functions[Name]
}

export type Database = {
  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
    Functions: TypedFunctions
  }
}
