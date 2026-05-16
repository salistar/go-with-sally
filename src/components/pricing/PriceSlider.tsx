/**
 * GO WITH SALLY - PRICE SLIDER COMPONENT
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { PRICE_LIKELIHOOD_COLORS, PRICE_LIKELIHOOD_ICONS } from '../../constants/pricing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 64;
const THUMB_SIZE = 32;

interface PriceSliderProps {
  minPrice: number;
  maxPrice: number;
  suggestedPrice: number;
  currentPrice: number;
  onPriceChange: (price: number) => void;
  currency?: string;
  step?: number;
  disabled?: boolean;
}

export const PriceSlider: React.FC<PriceSliderProps> = ({
  minPrice,
  maxPrice,
  suggestedPrice,
  currentPrice,
  onPriceChange,
  currency = 'MAD',
  step = 5,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const initialPosition = ((currentPrice - minPrice) / (maxPrice - minPrice)) * (SLIDER_WIDTH - THUMB_SIZE);
  const animatedValue = useRef(new Animated.Value(initialPosition)).current;

  const getColorForPrice = (price: number): string => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.3) return PRICE_LIKELIHOOD_COLORS.low;
    if (ratio < 0.5) return PRICE_LIKELIHOOD_COLORS.medium;
    if (ratio < 0.7) return PRICE_LIKELIHOOD_COLORS.high;
    return PRICE_LIKELIHOOD_COLORS.very_high;
  };

  const getLikelihood = (price: number): string => {
    const ratio = price / suggestedPrice;
    if (ratio >= 1.2) return 'very_high';
    if (ratio >= 1.0) return 'high';
    if (ratio >= 0.85) return 'medium';
    return 'low';
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        animatedValue.setOffset((animatedValue as any)._value);
        animatedValue.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        let newPosition = (animatedValue as any)._offset + gestureState.dx;
        newPosition = Math.max(0, Math.min(newPosition, SLIDER_WIDTH - THUMB_SIZE));
        animatedValue.setValue(gestureState.dx);

        const ratio = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
        const rawPrice = minPrice + ratio * (maxPrice - minPrice);
        const steppedPrice = Math.round(rawPrice / step) * step;
        
        if (steppedPrice !== currentPrice) {
          onPriceChange(Math.max(minPrice, Math.min(maxPrice, steppedPrice)));
        }
      },
      onPanResponderRelease: () => {
        animatedValue.flattenOffset();
      },
    })
  ).current;

  const thumbPosition = animatedValue.interpolate({
    inputRange: [-SLIDER_WIDTH, SLIDER_WIDTH],
    outputRange: [-SLIDER_WIDTH, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  const likelihood = getLikelihood(currentPrice);
  const likelihoodIcon = PRICE_LIKELIHOOD_ICONS[likelihood as keyof typeof PRICE_LIKELIHOOD_ICONS];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('pricing.yourPrice')}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: getColorForPrice(currentPrice) }]}>
            {currentPrice}
          </Text>
          <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>
            {currency}
          </Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <View style={[styles.track, { backgroundColor: theme.colors.border }]} />
        
        <View
          style={[
            styles.trackFilled,
            {
              width: `${((currentPrice - minPrice) / (maxPrice - minPrice)) * 100}%`,
              backgroundColor: getColorForPrice(currentPrice),
            },
          ]}
        />

        <View
          style={[
            styles.suggestedMarker,
            {
              left: ((suggestedPrice - minPrice) / (maxPrice - minPrice)) * SLIDER_WIDTH,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: thumbPosition }],
              left: initialPosition,
              backgroundColor: 'white',
              borderColor: getColorForPrice(currentPrice),
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.thumbInner, { backgroundColor: getColorForPrice(currentPrice) }]} />
        </Animated.View>
      </View>

      {/* Range Labels */}
      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
          {minPrice} {currency}
        </Text>
        <Text style={[styles.suggestedLabel, { color: theme.colors.primary }]}>
          {t('pricing.suggested')}: {suggestedPrice} {currency}
        </Text>
        <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
          {maxPrice} {currency}
        </Text>
      </View>

      {/* Likelihood Indicator */}
      <View style={[styles.likelihoodContainer, { backgroundColor: `${getColorForPrice(currentPrice)}20` }]}>
        <Text style={styles.likelihoodIcon}>{likelihoodIcon}</Text>
        <Text style={[styles.likelihoodText, { color: getColorForPrice(currentPrice) }]}>
          {t(`pricing.likelihood.${likelihood}`)}
        </Text>
      </View>

      {/* Hint */}
      <View style={[styles.hint, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
          {t('pricing.priceHint')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  currency: {
    fontSize: 18,
    marginLeft: 4,
  },
  sliderContainer: {
    height: 44,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  track: {
    position: 'absolute',
    height: 6,
    width: SLIDER_WIDTH,
    borderRadius: 3,
  },
  trackFilled: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  suggestedMarker: {
    position: 'absolute',
    width: 3,
    height: 20,
    borderRadius: 1.5,
    top: 12,
    marginLeft: -1.5,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontSize: 12,
  },
  suggestedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  likelihoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  likelihoodIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  likelihoodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  hintText: {
    fontSize: 13,
    flex: 1,
  },
});

export default PriceSlider;