import { useRef } from 'react';
import { View, StyleSheet, Platform, GestureResponderEvent } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TAB_ORDER = ['/(tabs)', '/(tabs)/search', '/(tabs)/sell', '/(tabs)/messages', '/(tabs)/profile'];
const PATHNAME_TO_INDEX: Record<string, number> = {
  '/': 0, '': 0,
  '/search': 1,
  '/sell': 2,
  '/messages': 3,
  '/profile': 4,
};

const SWIPE_DISTANCE_THRESHOLD = 70;
const MAX_VERTICAL_DRIFT = 60;

// Permet aux utilisateurs mobiles de glisser horizontalement pour passer
// d'un onglet à l'autre (Accueil ↔ Rechercher ↔ Vendre ↔ Messages ↔ Profil),
// en plus de la barre d'onglets classique en bas.
//
// Implémenté avec de simples écouteurs onTouchStart/onTouchEnd (phase bulle,
// natifs à React Native) plutôt qu'avec PanResponder : PanResponder gère un
// état de geste persistant entre les cycles tactiles qui peut se retrouver
// bloqué après un premier balayage sur certains navigateurs mobiles (le geste
// suivant n'est alors plus reconnu). Ici, chaque toucher est indépendant —
// aucun état n'est conservé d'un geste à l'autre — et comme ces écouteurs
// n'interceptent jamais le geste (pas de responder à revendiquer), le
// défilement des ScrollView imbriquées (catégories, villes, photos) continue
// de fonctionner normalement à côté.
export function SwipeableTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const start = useRef({ x: 0, y: 0, scroller: null as HTMLElement | null, scrollerStartLeft: 0 });

  const goToIndex = (index: number) => {
    if (index < 0 || index >= TAB_ORDER.length) return;
    router.replace(TAB_ORDER[index] as any);
  };

  // Sur le web, si le doigt démarre au-dessus d'une zone qui défile elle-même
  // horizontalement (catégories, villes, galerie photo), on repère ce
  // conteneur — mais on ne renonce au changement d'onglet que si CE
  // conteneur a réellement défilé pendant le geste (comparaison de
  // scrollLeft), pas juste parce que le doigt était dessus.
  const findHorizontalScroller = (e: GestureResponderEvent): HTMLElement | null => {
    if (Platform.OS !== 'web') return null;
    let node = (e.nativeEvent as any).target as HTMLElement | null;
    let depth = 0;
    while (node && depth < 12) {
      const style = window.getComputedStyle(node);
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && node.scrollWidth > node.clientWidth) {
        return node;
      }
      node = node.parentElement;
      depth++;
    }
    return null;
  };

  const onTouchStart = (e: GestureResponderEvent) => {
    const t = e.nativeEvent.touches[0] ?? e.nativeEvent;
    const scroller = findHorizontalScroller(e);
    start.current = { x: t.pageX, y: t.pageY, scroller, scrollerStartLeft: scroller?.scrollLeft ?? 0 };
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    const { scroller, scrollerStartLeft } = start.current;
    if (scroller && scroller.scrollLeft !== scrollerStartLeft) return;

    const t = e.nativeEvent.changedTouches[0] ?? e.nativeEvent;
    const dx = t.pageX - start.current.x;
    const dy = t.pageY - start.current.y;
    if (Math.abs(dy) > MAX_VERTICAL_DRIFT) return;

    const currentIndex = PATHNAME_TO_INDEX[pathnameRef.current] ?? 0;
    if (dx < -SWIPE_DISTANCE_THRESHOLD) goToIndex(currentIndex + 1);
    else if (dx > SWIPE_DISTANCE_THRESHOLD) goToIndex(currentIndex - 1);
  };

  return (
    <View style={styles.flex} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
