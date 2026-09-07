import { bumpCount, Env, readCount, readEvents, renderPage } from "./_lib";

const pageResponse = async (context: EventContext<Env, any, Record<string, unknown>>) => {
	const url = new URL(context.request.url);
	const fromTheme = url.searchParams.get("from") === "theme";
	const isGet = context.request.method === "GET";
	const count = isGet && fromTheme ? await bumpCount(context.env.DB) : await readCount(context.env.DB);
	const events = await readEvents(context.env.DB);
	const html = renderPage(count, events);
	const body =
		fromTheme && isGet
			? html.replace(
					"</head>",
					'<script>try{history.replaceState(null,"","/")}catch(e){}</script></head>'
				)
			: html;
	return new Response(context.request.method === "HEAD" ? null : body, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
};

export const onRequestGet: PagesFunction<Env> = async (context) => pageResponse(context);
export const onRequestHead: PagesFunction<Env> = async (context) => pageResponse(context);
