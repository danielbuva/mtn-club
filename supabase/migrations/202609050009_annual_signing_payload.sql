-- Registration answers are not signature evidence; send only the signing fields.
-- This also keeps long trip answers from exceeding the annual signature payload limit.
do $migration$ declare definition text; marker text; begin
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker:='perform public.sign_annual_waiver((p_data->>''waiverId'')::uuid,p_request_id,p_data);';
 if position(marker in definition)=0 then raise exception 'Annual signing integration marker missing'; end if;
 definition:=replace(definition,marker,$patch$
 perform public.sign_annual_waiver((p_data->>'waiverId')::uuid,p_request_id,jsonb_build_object(
   'waiverAgreed',p_data->'waiverAgreed','signatureName',p_data->'signatureName',
   'signerDetails',p_data->'signerDetails','emergencyContact',p_data->'emergencyContact'));
 $patch$);
 execute definition;
end $migration$;
