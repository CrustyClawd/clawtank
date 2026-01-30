'use client';

export function SketchfabEmbed() {
  return (
    <div className="w-full h-screen relative">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(180deg, #0a2040 0%, #061428 100%)' }}
      />

      {/* Sketchfab embed */}
      <iframe
        title="Lobster - Lowpoly"
        className="absolute inset-0 w-full h-full z-10"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking"
        src="https://sketchfab.com/models/ac70bc0a732b447d85022756f10267a2/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&preload=1&transparent=1&orbit_constraint_pitch_down=-15&orbit_constraint_pitch_up=75"
        style={{
          background: 'transparent',
        }}
      />

      {/* Gradient overlay at bottom for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(6,20,40,0.95) 0%, rgba(6,20,40,0.5) 50%, transparent 100%)'
        }}
      />
    </div>
  );
}
