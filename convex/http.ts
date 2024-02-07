import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/stablediffusion",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log(request.body);

    // const requestFormData = await request;
    // console.log(requestFormData);
    // console.log(requestFormData);
    // const fileBlob = requestFormData.get("file");
    // console.log(fileBlob);
    // const file = await fileBlob?.blob();

    // const imageSrc = requestFormData.get("file") as string;
    // console.log(imageSrc);
    // const { file } = Object.fromEntries(requestFormData.entries());
    // const result = await ctx.runAction(internal.stablediffusion.fulfill, {
    //   sourceImage: imageSrc,
    // });

    // Construct a response object
    const responseObject = {
      data: null,
    };

    return new Response(JSON.stringify(responseObject), {
      status: 200,
      headers: new Headers({
        // e.g. https://mywebsite.com, configured on your Convex dashboard
        "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
        Vary: "origin",
      }),
    });
  }),
});

http.route({
  path: "/stablediffusion",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          // e.g. https://mywebsite.com, configured on your Convex dashboard
          "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const result = await ctx.runAction(internal.clerk.fulfill, {
        payload: payloadString,
        headers: {
          "svix-id": headerPayload.get("svix-id")!,
          "svix-timestamp": headerPayload.get("svix-timestamp")!,
          "svix-signature": headerPayload.get("svix-signature")!,
        },
      });

      console.log(result.type);
      switch (result.type) {
        case "user.created":
          await ctx.runMutation(internal.users.createUser, {
            email: result.data.email_addresses[0]?.email_address,
            userId: result.data.id,
            name: `${result.data.first_name || ""} ${result.data.last_name || ""}`.trim(),
            profileImage: result.data.image_url,
          });
          break;
        case "user.updated":
          await ctx.runMutation(internal.users.updateUser, {
            userId: result.data.id,
            profileImage: result.data.image_url,
            name: `${result.data.first_name || ""} ${result.data.last_name || ""}`.trim(),
          });
          break;
        case "user.deleted":
          await ctx.runMutation(internal.users.deleteUser, {
            userId: result.data.id!,
          });
          break;
        // add user.updated case
      }

      return new Response(null, {
        status: 200,
      });
    } catch (err) {
      console.error(err);
      return new Response("Webhook Error", {
        status: 400,
      });
    }
  }),
});

http.route({
  path: "/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature") as string;

    const result = await ctx.runAction(internal.stripe.fulfill, {
      payload: await request.text(),
      signature,
    });

    if (result.success) {
      return new Response(null, {
        status: 200,
      });
    } else {
      return new Response("Webhook Error", {
        status: 400,
      });
    }
  }),
});

export default http;
