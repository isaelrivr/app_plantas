import React from 'react';
import { BlurTargetView } from 'expo-blur';
import { GlassSurface, GlassSurfaceProps } from './GlassSurface';
import { BlurTargetContext, useBlurTarget } from './GlassBackground';

export { BlurTargetContext, useBlurTarget, BlurTargetView };

export type GlassViewProps = GlassSurfaceProps;

/**
 * Superficie flotante con efecto glassmórfico.
 * @alias GlassSurface
 */
export const GlassView: React.FC<GlassViewProps> = (props) => {
  return <GlassSurface {...props} />;
};
