import { bumpCount, CLICK_HEADER, Env, json, optionsResponse } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async (context) => {
	if (context.request.headers.get(CLICK_HEADER) !== "1") {
		return json({ error: "direct visits are not counted" }, 400);
	}
	return json({ count: await bumpCount(context.env.DB) });
};

export const onRequestOptions: PagesFunction<Env> = async () => optionsResponse();
