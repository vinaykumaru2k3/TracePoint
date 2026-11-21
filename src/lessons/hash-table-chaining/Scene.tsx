import Buckets, { bucketFrame } from "../../iso/Buckets";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { BUCKETS, CHAIN_MAX, type ChainState } from "./generate";

const VIEW = fitBox(bucketFrame(BUCKETS, CHAIN_MAX), 20);

/** Five buckets along the back. Each chain grows toward the viewer. */
export default function Scene({ step }: { step: Step<ChainState> }) {
  const s = step.state;
  return (
    <IsoScene viewBox={VIEW} label={`Hash set with ${BUCKETS} buckets holding ${s.size} keys`}>
      <Buckets chains={s.chains} active={s.bucket} flag={s.flag} />
    </IsoScene>
  );
}
