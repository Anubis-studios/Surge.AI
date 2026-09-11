import { useState } from 'react';
import { useStore, VIDEO_COST_BUCKS } from '../store';
import { Video, DollarSign, Film, Play, Loader2, Clock, CheckCircle } from 'lucide-react';

export default function VideoEngine() {
  const { state, generateVideo } = useStore();
  const [prompt, setPrompt] = useState('');
  const [scenes, setScenes] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (state.billing.surge_bucks < VIDEO_COST_BUCKS) return;

    setIsGenerating(true);
    const assets = { scenes: scenes.filter(s => s.trim()) };

    // Simulate processing delay (supplier passthrough)
    await new Promise(resolve => setTimeout(resolve, 2500));
    generateVideo(prompt, assets);
    setIsGenerating(false);
  };

  const addScene = () => {
    setScenes([...scenes, '']);
  };

  const updateScene = (index: number, value: string) => {
    const newScenes = [...scenes];
    newScenes[index] = value;
    setScenes(newScenes);
  };

  const removeScene = (index: number) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="w-8 h-8 text-cyber-purple" />
            <span className="bg-gradient-to-r from-cyber-purple to-cyan-400 bg-clip-text text-transparent">
              Video Engine
            </span>
          </h1>
          <p className="text-obsidian-500 mt-1">Premium supplier passthrough video generation</p>
        </div>
        <div className="stat-box py-3 px-5 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-cyber-purple" />
          <span className="text-xl font-bold text-cyber-purple font-mono">{state.billing.surge_bucks}</span>
          <span className="text-sm text-obsidian-500">bucks</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Generation Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Prompt */}
          <div className="obsidian-panel p-5">
            <label className="text-sm font-medium text-obsidian-400 mb-2 block">Video Prompt</label>
            <textarea
              className="terminal-input min-h-[100px] resize-none"
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          {/* Storyboard / Scenes */}
          <div className="obsidian-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-obsidian-400">Storyboard (Optional)</label>
              <button
                onClick={addScene}
                className="text-xs text-gold-400 hover:text-gold-300 font-medium"
              >
                + Add Scene
              </button>
            </div>
            <div className="space-y-2">
              {scenes.map((scene, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-obsidian-600 font-mono w-6">#{i + 1}</span>
                  <input
                    type="text"
                    className="terminal-input py-2 text-sm flex-1"
                    placeholder={`Scene ${i + 1} description...`}
                    value={scene}
                    onChange={e => updateScene(i, e.target.value)}
                  />
                  {scenes.length > 1 && (
                    <button
                      onClick={() => removeScene(i)}
                      className="text-obsidian-600 hover:text-red-400 text-sm px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Info */}
          <div className="obsidian-panel p-4 bg-cyber-purple/5 border-cyber-purple/20">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-cyber-purple" />
              <span className="text-sm font-medium text-cyber-purple">Supplier: Wireflow v2</span>
            </div>
            <p className="text-xs text-obsidian-400">
              Videos are rendered via our premium supplier network with automatic fallback routing for maximum reliability.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || state.billing.surge_bucks < VIDEO_COST_BUCKS || isGenerating}
            className="w-full py-4 px-6 rounded-full font-bold text-sm uppercase tracking-wider transition-all bg-gradient-to-r from-cyber-purple to-cyan-500 text-white shadow-lg shadow-cyber-purple/20 hover:shadow-cyber-purple/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rendering via supplier...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Video ({VIDEO_COST_BUCKS} Surge Bucks)
              </>
            )}
          </button>

          {state.billing.surge_bucks < VIDEO_COST_BUCKS && (
            <p className="text-sm text-red-400 text-center">
              Not enough Surge Bucks. <a href="/billing" className="text-gold-400 underline">Buy more →</a>
            </p>
          )}
        </div>

        {/* Video Gallery */}
        <div className="lg:col-span-3">
          <div className="obsidian-panel p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-cyber-purple" />
                Generated Videos
              </h3>
              <span className="text-sm text-obsidian-500">{state.videos.length} videos</span>
            </div>

            {state.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-obsidian-800 flex items-center justify-center mb-4">
                  <Video className="w-10 h-10 text-obsidian-600" />
                </div>
                <p className="text-obsidian-400 font-medium">No videos yet</p>
                <p className="text-obsidian-600 text-sm mt-1">Create your first AI video using the engine</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {state.videos.map(vid => (
                  <div key={vid.id} className="image-card p-3 flex gap-4">
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={vid.output_url || ''}
                        alt={vid.input_prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{vid.input_prompt}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-obsidian-500">
                          <Clock className="w-3 h-3" />
                          {String(vid.metadata?.duration || '4s')}
                        </span>
                        <span className="text-xs text-obsidian-500">
                          {String(vid.metadata?.resolution || '1080p')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {vid.status}
                        </span>
                      </div>
                      <p className="text-xs text-obsidian-600 mt-1">
                        via {vid.supplier} • {new Date(vid.created_at).toLocaleDateString()}
                      </p>
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
