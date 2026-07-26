import {Composition, Folder} from "remotion";
import {WelcomeToMagnus} from "./WelcomeToMagnus";
import {WelcomeToMagnusV2} from "./WelcomeToMagnusV2";

export const RemotionRoot = () => {
  return (
    <Folder name="Magnus">
      <Composition
        id="MagnusWelcome"
        component={WelcomeToMagnus}
        durationInFrames={630}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MagnusWelcomeV2"
        component={WelcomeToMagnusV2}
        durationInFrames={630}
        fps={30}
        width={1920}
        height={1080}
      />
    </Folder>
  );
};
