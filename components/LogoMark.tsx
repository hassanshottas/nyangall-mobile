import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

type Props = { size?: number; color?: string; accent?: string };

// Pictogramme NyangAll : sac de shopping (marketplace) surmonté d'une étoile
// de David en accent — identité claire et lisible même en petite taille
// (favicon, icône d'app).
export function LogoMark({ size = 32, color = '#fff', accent = Colors.accent }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M27,38 L73,38 L79,76 Q79,82 73,82 L27,82 Q21,82 21,76 Z" fill={color} />
      <Path d="M37,38 C37,24 63,24 63,38" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path
        d="M63,40 L65.89,45 L71.66,45 L68.77,50 L71.66,55 L65.89,55 L63,60 L60.11,55 L54.34,55 L57.23,50 L54.34,45 L60.11,45 Z"
        fill={accent}
      />
    </Svg>
  );
}
