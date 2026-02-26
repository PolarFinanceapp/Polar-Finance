import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, FeMerge, FeMergeNode, Filter, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

interface Props { size?: number }

export default function PolarLogo({ size = 160 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="arcticBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#0d0d1e" />
          <Stop offset="100%" stopColor="#060612" />
        </LinearGradient>
        <LinearGradient id="bearBlue" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#a89fff" />
          <Stop offset="50%" stopColor="#7B6FFF" />
          <Stop offset="100%" stopColor="#00D4AA" />
        </LinearGradient>
        <RadialGradient id="bgGlow6" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="rgba(108,99,255,0.12)" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
        <Filter id="blueGlow">
          <FeGaussianBlur stdDeviation="3.5" result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Background */}
      <Circle cx="80" cy="80" r="78" fill="url(#arcticBg)" stroke="rgba(108,99,255,.35)" strokeWidth="1.5" />
      <Circle cx="80" cy="80" r="78" fill="url(#bgGlow6)" />
      <Circle cx="80" cy="80" r="71" fill="none" stroke="rgba(108,99,255,.1)" strokeWidth="1" />

      {/* Ears */}
      <Circle cx="52" cy="59" r="10" fill="url(#bearBlue)" />
      <Circle cx="108" cy="59" r="10" fill="url(#bearBlue)" />
      <Circle cx="52" cy="59" r="5" fill="#060612" opacity={0.5} />
      <Circle cx="108" cy="59" r="5" fill="#060612" opacity={0.5} />

      {/* Face */}
      <Ellipse cx="80" cy="88" rx="36" ry="34" fill="url(#bearBlue)" opacity={0.9} />

      {/* Eyes */}
      <Circle cx="67" cy="80" r="4.2" fill="#060612" />
      <Circle cx="93" cy="80" r="4.2" fill="#060612" />
      <Circle cx="68.4" cy="78.6" r="1.4" fill="rgba(255,255,255,.5)" />
      <Circle cx="94.4" cy="78.6" r="1.4" fill="rgba(255,255,255,.5)" />

      {/* Nose */}
      <Ellipse cx="80" cy="91" rx="6.5" ry="4.5" fill="#060612" />
      <Ellipse cx="80" cy="90.2" rx="3.5" ry="2.2" fill="rgba(108,99,255,.5)" />

      {/* Smile */}
      <Path d="M74 97 Q80 103 86 97" stroke="#060612" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}