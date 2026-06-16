import type { RelationshipReport } from '../domain/relationshipAnalyzer';

interface ReferenceChainsProps {
  relationships: RelationshipReport;
}

export function ReferenceChains({ relationships }: ReferenceChainsProps) {
  const hasSceneChains = relationships.sceneChains.length > 0;
  const hasBufferChains = relationships.bufferChains.length > 0;

  return (
    <section className="reference-chains" aria-label="glTF reference chains">
      <h2>Reference Chains</h2>
      <h3>scene -&gt; node -&gt; mesh -&gt; material -&gt; texture -&gt; image</h3>
      {hasSceneChains ? (
        <ul>
          {relationships.sceneChains.map((chain, index) => (
            <li key={`${chain.scene}-${chain.node}-${index}`}>
              {[chain.scene, chain.node, chain.mesh, chain.primitive, chain.material, chain.textureSlot, chain.texture, chain.image]
                .filter(Boolean)
                .join(' -> ')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No scene reference chains found.</p>
      )}
      <h3>mesh primitive -&gt; accessor -&gt; bufferView -&gt; buffer</h3>
      {hasBufferChains ? (
        <ul>
          {relationships.bufferChains.map((chain, index) => (
            <li key={`${chain.mesh}-${chain.primitive}-${chain.attribute}-${index}`}>
              {[chain.mesh, chain.primitive, chain.attribute, chain.accessor, chain.bufferView, chain.buffer]
                .filter(Boolean)
                .join(' -> ')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No buffer reference chains found.</p>
      )}
    </section>
  );
}
