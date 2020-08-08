import { process, driver } from "gremlin";
const { traversal } = process.AnonymousTraversalSource;
const { DriverRemoteConnection } = driver;
import { ApolloServer, gql } from "apollo-server";

(async () => {
  const g = traversal().withRemote(
    new DriverRemoteConnection("ws://localhost:8182/gremlin")
  );

  const p = (await g.V(1).elementMap().next()).value;
  console.log(p);
  // TODO: get queried fields from resolver and pass them to elementMap()

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
        return p;
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
