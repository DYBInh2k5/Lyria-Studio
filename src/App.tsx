import React, { useState, useRef, useEffect } from "react";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Mic2, 
  Settings, 
  History, 
  Download, 
  Share2, 
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { generateMusic, MusicGenerationResult } from "@/src/services/gemini";
import { cn } from "@/lib/utils";

interface Track extends MusicGenerationResult {
  id: string;
  prompt: string;
  timestamp: number;
  model: string;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [model, setModel] = useState<"lyria-3-clip-preview" | "lyria-3-pro-preview">("lyria-3-clip-preview");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load tracks from local storage on mount
  useEffect(() => {
    const savedTracks = localStorage.getItem("lyria_tracks");
    if (savedTracks) {
      try {
        setTracks(JSON.parse(savedTracks));
      } catch (e) {
        console.error("Failed to load tracks", e);
      }
    }
  }, []);

  // Save tracks to local storage when they change
  useEffect(() => {
    localStorage.setItem("lyria_tracks", JSON.stringify(tracks));
  }, [tracks]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await generateMusic(prompt, model);
      const newTrack: Track = {
        ...result,
        id: Math.random().toString(36).substring(7),
        prompt,
        timestamp: Date.now(),
        model
      };
      setTracks([newTrack, ...tracks]);
      setCurrentTrack(newTrack);
      setPrompt("");
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const deleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTracks(tracks.filter(t => t.id !== id));
    if (currentTrack?.id === id) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-r border-hardware-border bg-hardware-bg flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-hardware-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,68,68,0.3)]">
            <Music className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">Lyria Studio</h1>
            <p className="hardware-display text-[10px]">AI Music Engine v3.0</p>
          </div>
        </div>

        <Separator className="bg-hardware-border" />

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-hardware-muted">
              <History className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">History</span>
            </div>
            <Badge variant="outline" className="border-hardware-border text-hardware-muted text-[10px]">
              {tracks.length} Tracks
            </Badge>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {tracks.length === 0 ? (
                <div className="py-12 text-center">
                  <Music className="w-8 h-8 text-hardware-border mx-auto mb-2 opacity-20" />
                  <p className="text-xs text-hardware-muted">No tracks generated yet</p>
                </div>
              ) : (
                tracks.map((track) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={track.id}
                    onClick={() => {
                      setCurrentTrack(track);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      "group p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden",
                      currentTrack?.id === track.id
                        ? "bg-hardware-border/40 border-hardware-accent/50"
                        : "bg-transparent border-hardware-border hover:border-hardware-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate pr-6">
                          {track.prompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-hardware-muted uppercase tracking-tighter">
                            {new Date(track.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-hardware-accent uppercase font-bold">
                            {track.model === "lyria-3-clip-preview" ? "CLIP" : "PRO"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-hardware-muted hover:text-hardware-accent"
                        onClick={(e) => deleteTrack(track.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-hardware-accent w-full animate-pulse" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-hardware-border">
          <Button variant="outline" className="w-full border-hardware-border hover:bg-hardware-border/50 text-xs h-9">
            <Settings className="w-4 h-4 mr-2" />
            Studio Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-16 border-bottom border-hardware-border flex items-center justify-between px-8 bg-hardware-bg/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={cn("hardware-led", isGenerating && "hardware-led-active")} />
              <span className="hardware-display">System Status: {isGenerating ? "Processing" : "Idle"}</span>
            </div>
            <div className="h-4 w-[1px] bg-hardware-border" />
            <div className="flex items-center gap-2">
              <span className="hardware-display">Model:</span>
              <Select value={model} onValueChange={(v: any) => setModel(v)}>
                <SelectTrigger className="w-[140px] h-7 border-none bg-transparent hardware-display focus:ring-0 p-0 hover:text-white transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-hardware-bg border-hardware-border text-white">
                  <SelectItem value="lyria-3-clip-preview">Lyria Clip (30s)</SelectItem>
                  <SelectItem value="lyria-3-pro-preview">Lyria Pro (Full)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-hardware-muted hover:text-white">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-hardware-muted hover:text-white">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Studio Area */}
        <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
          {/* Prompt Section */}
          <section className="max-w-4xl mx-auto w-full">
            <div className="hardware-card p-1">
              <div className="flex items-center gap-2 p-2 bg-[#0a0a0b] rounded-t-lg border-b border-hardware-border">
                <Sparkles className="w-4 h-4 text-hardware-accent" />
                <span className="hardware-display">Neural Music Prompt</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-xs text-hardware-muted uppercase tracking-widest">Describe your sound</Label>
                  <div className="relative">
                    <Input
                      id="prompt"
                      placeholder="e.g. A lo-fi hip hop beat with rainy atmosphere and a melancholic piano melody..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-[#0a0a0b] border-hardware-border focus-visible:ring-hardware-accent h-14 text-lg pr-32"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <div className="absolute right-2 top-2 bottom-2">
                      <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt.trim()}
                        className="h-full bg-hardware-accent hover:bg-hardware-accent/90 text-white font-bold px-6"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "GENERATE"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {["Cinematic", "Lo-fi", "Cyberpunk", "Orchestral", "Jazz Fusion", "Techno"].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setPrompt(prev => prev + (prev ? ", " : "") + tag)}
                      className="px-3 py-1 rounded-full border border-hardware-border text-[10px] uppercase tracking-wider text-hardware-muted hover:border-hardware-accent hover:text-white transition-all"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Visualization / Player Section */}
          <section className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              {/* Visualizer Card */}
              <Card className="lg:col-span-2 hardware-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-hardware-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-hardware-accent" />
                    <span className="hardware-display">Waveform Analysis</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("w-1 h-3 rounded-full bg-hardware-border", isPlaying && "animate-bounce")} style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-[#0a0a0b] relative flex items-center justify-center overflow-hidden">
                  {/* Mock Visualizer */}
                  <div className="flex items-center gap-1 h-32">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: isPlaying ? [20, Math.random() * 100 + 20, 20] : 4,
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + Math.random() * 0.5,
                          ease: "easeInOut",
                        }}
                        className={cn(
                          "w-1 rounded-full",
                          isPlaying ? "bg-hardware-accent" : "bg-hardware-border"
                        )}
                      />
                    ))}
                  </div>
                  
                  {/* Overlay Info */}
                  <div className="absolute top-6 left-6">
                    <p className="hardware-display text-[10px] opacity-50">Frequency Response</p>
                    <p className="text-xl font-mono font-bold">24-bit / 48kHz</p>
                  </div>
                  
                  <div className="absolute bottom-6 right-6 text-right">
                    <p className="hardware-display text-[10px] opacity-50">Current Position</p>
                    <p className="text-xl font-mono font-bold text-hardware-accent">{formatTime(currentTime)}</p>
                  </div>
                </div>
              </Card>

              {/* Lyrics / Metadata Card */}
              <Card className="hardware-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-hardware-border">
                  <span className="hardware-display">Lyrics & Metadata</span>
                </div>
                <ScrollArea className="flex-1 p-6">
                  {currentTrack ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-hardware-muted mb-2">Generated Lyrics</h3>
                        <p className="text-sm leading-relaxed text-hardware-text/80 italic font-serif">
                          {currentTrack.lyrics || "No lyrics generated for this track."}
                        </p>
                      </div>
                      <Separator className="bg-hardware-border" />
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-hardware-muted mb-2">Prompt Context</h3>
                        <p className="text-xs text-hardware-muted">
                          {currentTrack.prompt}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <Mic2 className="w-12 h-12 mb-4" />
                      <p className="text-xs uppercase tracking-tighter">Select a track to view details</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </section>
        </div>

        {/* Bottom Player Bar */}
        <footer className="h-24 bg-hardware-bg border-t border-hardware-border px-8 flex items-center gap-8 z-20">
          {/* Track Info */}
          <div className="w-72 flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-hardware-border flex items-center justify-center overflow-hidden">
              {currentTrack ? (
                <div className="w-full h-full bg-gradient-to-br from-hardware-accent to-purple-600 animate-pulse" />
              ) : (
                <Music className="w-6 h-6 text-hardware-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {currentTrack ? currentTrack.prompt : "No Track Selected"}
              </p>
              <p className="text-[10px] text-hardware-muted uppercase tracking-wider">
                {currentTrack ? `Lyria ${currentTrack.model === "lyria-3-clip-preview" ? "Clip" : "Pro"}` : "Ready to generate"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="text-hardware-muted hover:text-white">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                onClick={togglePlay}
                disabled={!currentTrack}
                className="w-12 h-12 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-hardware-muted hover:text-white">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            <div className="w-full max-w-2xl flex items-center gap-3">
              <span className="text-[10px] font-mono text-hardware-muted w-10 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-[10px] font-mono text-hardware-muted w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Extra */}
          <div className="w-72 flex items-center justify-end gap-4">
            <div className="flex items-center gap-3 w-32">
              <Volume2 className="w-4 h-4 text-hardware-muted" />
              <Slider
                value={volume}
                max={100}
                onValueChange={(v) => {
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v[0] / 100;
                }}
              />
            </div>
            <div className="h-4 w-[1px] bg-hardware-border" />
            <Button variant="ghost" size="icon" className="text-hardware-muted hover:text-white">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      </main>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hardware-accent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
    </div>
  );
}
