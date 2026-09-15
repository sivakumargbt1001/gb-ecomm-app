import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { ProductImage } from "@geekbase-labs/shared-types";

// The main photo with a strip of thumbnails under it. The parent keys this by
// the selected colour, so a new colour opens on its own first photo.
export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  return (
    <View testID="product-gallery">
      <View className="aspect-square bg-neutral-100">
        {current ? (
          <Image
            testID="gallery-main"
            source={{ uri: current.url }}
            className="h-full w-full"
            // The whole photo, never cropped, as on the website.
            resizeMode="contain"
            accessibilityLabel={current.alt ?? undefined}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="text-neutral-400">No image</Text>
          </View>
        )}
      </View>
      {images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 pt-3"
        >
          {images.map((img, index) => (
            <Pressable
              key={img.id}
              testID="gallery-thumb"
              accessibilityRole="button"
              accessibilityLabel={`Show image ${index + 1} of ${images.length}`}
              accessibilityState={{ selected: index === active }}
              onPress={() => setActive(index)}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                index === active ? "border-black" : "border-neutral-200"
              }`}
            >
              <Image source={{ uri: img.url }} className="h-full w-full" resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
