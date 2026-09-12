import { useState } from 'react';
import { useStore, IMAGE_COST_COINS } from '../store';
import { useBillingStatus, useImageGeneration, useRecentImages } from '../hooks/useApi';
import { Image, Coins, Sparkles, Download, Wand2, Loader2 } from 'lucide-react';

const STYLE_PRESETS = [
  { id: 'none', label: 'None', emoji: '🎨' },
  { id: 'photorealistic', label: 'Photorealistic', emoji: '📷' },
  { id: 'anime', label: 'Anime', emoji: '🎌' },
  { id: 'oil-painting', label: 'Oil Painting', emoji: '🖼️' },
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '🌃' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: '3d-render', label: '3D Render', emoji: '💎' },
  { id: 'watercolor', label: 'Watercolor', emoji: '🎭' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', width: 1024, height: 1024 },
  { id: '16:9', label: '16:9', width: 1344, height: 768 },
  { id: '9:16', label: '9:16', width: 768, height: 1344 },
  { id: '4:3', label: '4:3', width: 1152, height: 896 },
];

export default function ImageStudio() {
  const { state } = useStore();
  const { data: apiBilling } = useBillingStatus();
  const { submitGeneration, loading: isGenerating, error: generationError } = useImageGeneration();
  const { data: recentImages, refetch: refetchImages } = useRecentImages();
  
  // Use API data if available, fallback to store
  const billing = apiBilling || state.billing;
  const images = recentImages.length > 0 ? recentImages : state.images;
  
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [selectedRatio, setSelectedRatio] = useState('1:1');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (billing.surge_coins < IMAGE_COST_COINS) return;

    const fullPrompt = selectedStyle !== 'none'
      ? `${prompt}, ${selectedStyle} style`
      : prompt;

    const ratio = ASPECT_RATIOS.find(r => r.id === selectedRatio) || ASPECT_RATIOS[0];

    try {
      await submitGeneration(fullPrompt, { style: selectedStyle, width: ratio.width, height: ratio.height });
      setPrompt('');
      refetchImages();
    } catch (err) {
      console.error('Image generation failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gold-heading flex items-center gap-3">
            <Image className="w-8 h-8 text-gold-400" />
            Image Studio
          </h1>
          <p className="text-obsidian-500 mt-1">Premium AI image generation</p>
        </div>
        <div className="stat-box py-3 px-5 flex items-center gap-3">
          <Coins className="w-5 h-5 text-gold-400" />
          <span className="text-xl font-bold text-gold-400 font-mono">{billing.surge_coins}</span>
          <span className="text-sm text-obsidian-500">coins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Generation Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Prompt Input */}
          <div className="obsidian-panel p-5">
            <label className="text-sm font-medium text-obsidian-400 mb-2 block">Prompt</label>
            <textarea
              className="terminal-input min-h-[120px] resize-none"
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <p className="text-xs text-obsidian-600 mt-2">
              Be descriptive for better results. Include style, mood, lighting, and composition details.
            </p>
          </div>

          {/* Style Presets */}
          <div className="obsidian-panel p-5">
            <label className="text-sm font-medium text-obsidian-400 mb-3 block">Style Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style.id
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40'
                      : 'bg-obsidian-800 text-obsidian-400 border border-obsidian-600 hover:border-obsidian-500'
                  }`}
                >
                  <span className="block text-lg mb-0.5">{style.emoji}</span>
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="obsidian-panel p-5">
            <label className="text-sm font-medium text-obsidian-400 mb-3 block">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedRatio(ratio.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedRatio === ratio.id
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40'
                      : 'bg-obsidian-800 text-obsidian-400 border border-obsidian-600 hover:border-obsidian-500'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || billing.surge_coins < IMAGE_COST_COINS || isGenerating}
            className="gold-capsule-button w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Image ({IMAGE_COST_COINS} Surge Coin)
              </>
            )}
          </button>

          {billing.surge_coins < IMAGE_COST_COINS && (
            <p className="text-sm text-red-400 text-center">
              Not enough Surge Coins. <a href="/billing" className="text-gold-400 underline">Buy more →</a>
            </p>
          )}
        </div>

        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="obsidian-panel p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-400" />
                Generated Images
              </h3>
              <span className="text-sm text-obsidian-500">{images.length} images</span>
            </div>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-obsidian-800 flex items-center justify-center mb-4">
                  <Image className="w-10 h-10 text-obsidian-600" />
                </div>
                <p className="text-obsidian-400 font-medium">No images yet</p>
                <p className="text-obsidian-600 text-sm mt-1">Enter a prompt and generate your first AI image</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                {images.map(img => (
                  <div key={img.id} className="image-card group">
                    <div className="relative">
                      <img
                        src={img.output_url}
                        alt={img.prompt}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-obsidian-400 truncate">{img.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
