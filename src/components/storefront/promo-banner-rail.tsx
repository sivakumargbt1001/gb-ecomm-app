import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { VideoView, useVideoPlayer } from "expo-video";
import type { PromoBanner } from "@geekbase-labs/shared-types";

import { SITE_SETTINGS_QUERY_KEY } from "../../lib/site-theme-context";
import { fetchSiteSettings } from "../../lib/site-settings-api";

const GAP = 12;
const SIDE = 16;

// Module-level because FlatList refuses a viewability config that changes
// after mount, and a constant cannot.
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

// The same rail the website shows under its header: the admin's cards in the
// admin's order, each an image or a muted looping video. The public settings
// endpoint has already dropped anything outside its window. Shares the theme
// provider's query, so the cards cost no second request.
export function PromoBannerRail() {
  const { width } = useWindowDimensions();
  const { data } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
  const banners = data?.promoBanners ?? [];
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());

  // Only a card that is actually on screen plays its video.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<PromoBanner>[] }) => {
      setVisibleIds(new Set(viewableItems.map((token) => token.item.id)));
    },
    [],
  );

  if (banners.length === 0) return null;

  // One card takes the full width; more than one shows a sliver of the next
  // so the row reads as swipeable.
  const cardWidth = banners.length === 1 ? width - SIDE * 2 : Math.round(width * 0.82);

  return (
    <FlatList
      testID="promo-banner-rail"
      horizontal
      data={banners}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP, paddingVertical: 12 }}
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <BannerCard
          banner={item}
          width={cardWidth}
          active={visibleIds.has(item.id)}
        />
      )}
    />
  );
}

function BannerCard({
  banner,
  width,
  active,
}: {
  banner: PromoBanner;
  width: number;
  active: boolean;
}) {
  const height = Math.round(width * 1.1);
  const open = () => {
    if (banner.linkUrl) void Linking.openURL(banner.linkUrl);
  };

  return (
    <Pressable
      testID="promo-banner-card"
      accessibilityRole={banner.linkUrl ? "link" : "image"}
      accessibilityLabel={banner.title ?? "Promotion"}
      onPress={open}
      disabled={!banner.linkUrl}
      style={{ width, height }}
      className="overflow-hidden rounded-2xl bg-neutral-100"
    >
      {banner.mediaType === "video" ? (
        <BannerVideo url={banner.mediaUrl} active={active} />
      ) : (
        <Image
          source={{ uri: banner.mediaUrl }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      )}
      {(banner.title || banner.subtitle) && (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          {banner.title && (
            <Text className="text-2xl font-bold text-white">{banner.title}</Text>
          )}
          {banner.subtitle && (
            <Text className="mt-1 text-sm text-white">{banner.subtitle}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

function BannerVideo({ url, active }: { url: string; active: boolean }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  // Play and pause follow visibility rather than mount, so a card scrolled
  // off the edge stops burning battery and data.
  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
