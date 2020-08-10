import { process, driver } from "gremlin";
const {
  AnonymousTraversalSource: { traversal },
  statics: __,
  withOptions,
} = process;
const { DriverRemoteConnection } = driver;
import { ApolloServer, gql } from "apollo-server";
import getFieldsToResolve from "graphql-fields";

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
      person: async (parent, args, context, info) => {
        let tr = g.V(1);

        const fields = getFieldsToResolve(info);
        const topLevelFields = Object.keys(fields);

        // TODO: create abstraction for "get properties from node"

        tr = tr.valueMap(...topLevelFields);

        // ID field must be explicitly requested, valueMap() does not include
        // it by default
        if (topLevelFields.includes("id")) {
          tr = tr.with_(withOptions.tokens, withOptions.ids);
        }

        // Property values are normally wrapped in an array, this unfolds the
        // array if it contains only one element
        // TODO: dont unfold single-element arrays when an array should be returned
        tr = tr.by(__.unfold());

        const result = (await tr.next()).value;
        console.log(result);
        if (!(result instanceof Map)) {
          throw new TypeError("Expected traversal result to be a map");
        }

        // I'm not sure how fromEntries() is converting the ID map entry
        // correctly, even though entries() represents it as an EnumValue
        return Object.fromEntries(result.entries());
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
