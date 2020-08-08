import { process, driver } from "gremlin";
const { traversal } = process.AnonymousTraversalSource;
const { DriverRemoteConnection } = driver;

(async () => {
  const g = traversal().withRemote(
    new DriverRemoteConnection("ws://localhost:8182/gremlin")
  );

  const names = await g.V().hasLabel("person").values("name").toList();
  console.log(names);
})();
