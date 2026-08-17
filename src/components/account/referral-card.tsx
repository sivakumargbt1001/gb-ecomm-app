import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";

import { referralShareMessage } from "../../lib/referral";
import { useCreateReferralCode, useReferralSummary } from "../../lib/use-referrals";
import { useSiteTheme } from "../../lib/site-theme-context";

// The mobile half of the referral programme is the share sheet: a phone is
// where a link actually gets sent to somebody, so there is no copy-to-clipboard
// control here the way there is on the website.
export function ReferralCard() {
  const { summary, isLoading } = useReferralSummary();
  const createCode = useCreateReferralCode();
  const theme = useSiteTheme();

  if (isLoading || !summary) return null;

  // Nothing to offer when the merchant is not running the programme.
  if (!summary.enabled) return null;

  async function share() {
    if (!summary?.shareUrl) return;
    await Share.share({ message: referralShareMessage(summary) });
  }

  return (
    <View
      testID="referral-card"
      className="w-full gap-3 rounded-xl border border-neutral-200 p-4"
    >
      <Text className="text-sm font-semibold text-neutral-800">Invite a friend</Text>
      <Text testID="referral-reward" className="text-xs text-neutral-500">
        Your friend gets a discount on their first order, and you get{" "}
        {summary.referrerRewardPoints} points once they&apos;ve paid for it.
      </Text>

      {summary.shareUrl ? (
        <>
          <Text testID="referral-code" className="text-lg font-semibold">
            {summary.code}
          </Text>
          <View className="flex-row gap-6">
            <View>
              <Text className="text-xs text-neutral-500">Signed up</Text>
              <Text testID="referral-invited" className="text-base font-semibold">
                {summary.invited}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-neutral-500">Rewarded</Text>
              <Text testID="referral-rewarded" className="text-base font-semibold">
                {summary.rewarded}
              </Text>
            </View>
          </View>
          <Pressable
            testID="referral-share"
            onPress={share}
            className="items-center rounded-lg py-3"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="font-semibold text-white">Share your link</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          testID="referral-get-link"
          onPress={() => createCode.mutate()}
          disabled={createCode.isPending}
          className="items-center rounded-lg py-3 disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {createCode.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Get your link</Text>
          )}
        </Pressable>
      )}

      {createCode.isError && (
        <Text className="text-xs font-medium text-red-600">
          {createCode.error.message}
        </Text>
      )}
    </View>
  );
}
