import { Env, json, optionsResponse, readCount } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async (context) =>
	json({ count: await readCount(context.env.DB) });

export const onRequestOptions: PagesFunction<Env> = async () => optionsResponse();
