export default {
 providers: [
   {
     domain: process.env.CLERK_ISSUER_ENV,
     applicationID: "convex",
   },
 ]
};