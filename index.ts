import { process, driver } from "gremlin";
const {
  AnonymousTraversalSource: { traversal },
  statics: __,
  withOptions
} = process;
const { DriverRemoteConnection } = driver;
import { ApolloServer, gql } from "apollo-server";

(async () => {
  const g = traversal().withRemote(
    new DriverRemoteConnection("ws://localhost:8182/gremlin")
  );

  // Seems like it doesn't do anything when server is not reachable.
  // It simply waits forever when making a query.
  // TODO: check if we are actually connected

  const typeDefs = gql`
    type Query {
      person: Person
    }

    type Person {
      id: ID!
      name: String!
      age: Int!
    }
  `;

  const resolvers = {
    Query: {
      person: async () => {
        const p = (await g.V(1).valueMap().with_(withOptions.tokens, withOptions.ids).by(__.unfold()).next()).value;

        // TODO: get only the requested fields
        // TODO: dont unfold single-element arrays when an array should be returned

        // TODO: assert that p is a map
        // I'm not sure how fromEntries() is converting the ID map entry
        // correctly, even though entries() represents it as an EnumValue
        return Object.fromEntries(p.entries());
      },
    },
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await server.listen();
  console.log(`🚀 Server ready at ${url}`);
})();
