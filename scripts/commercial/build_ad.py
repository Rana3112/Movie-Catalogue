#!/usr/bin/env python3
"""
CinePulse Professional Commercial Video Generator
Generates a 1080p 60fps / 30fps broadcast-quality video advertisement
Complete with voiceover, kinetic visuals, real app UI mockups, and cinematic soundtrack.
"""

import os
import subprocess
import json
import math
import numpy as np
import scipy.io.wavfile as wavfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")
BUILD_DIR = os.path.join(SCRIPT_DIR, "build")
OUTPUT_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "public", "commercial")

os.makedirs(BUILD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 7 Cinematic Scenes Script
SCENES = [
    {
        "id": "scene1_problem",
        "voice": "Tired of paying for endless streaming subscriptions, only to face constant buffering and broken links?",
        "badge": "⚠️ THE STREAMING PROBLEM",
        "title": "TIRED OF STREAMING CHAOS?",
        "subtitle": "Fragmented Subscriptions • Buffering Loops • Broken Dead Links",
        "points": [
            "❌ 5+ monthly subscriptions costing over $80/mo",
            "❌ Endless 'Server Error' and broken video players",
            "❌ Invasive popups, scams, and redirect malware"
        ],
        "image_key": "movies_ui.png",
        "accent_color": (239, 68, 68),  # Red
        "badge_bg": (239, 68, 68, 40)
    },
    {
        "id": "scene2_reveal",
        "voice": "Welcome to CinePulse. The next generation, all in one cinematic universe built for true entertainment lovers.",
        "badge": "⚡ INTRODUCING CINEPULSE",
        "title": "THE FUTURE OF CINEMA IS HERE",
        "subtitle": "One Unified Platform • Completely Free • Zero Distractions",
        "points": [
            "💎 Premium glassmorphism dark-mode interface",
            "🚀 Instant streaming across Web and Android",
            "✨ Built from the ground up for movie purists"
        ],
        "image_key": "logo.png",
        "accent_color": (56, 189, 248),  # Sky Blue
        "badge_bg": (56, 189, 248, 40)
    },
    {
        "id": "scene3_catalog",
        "voice": "Access millions of Hollywood blockbusters, binge worthy TV series, anime with sub and dub, and live world sports.",
        "badge": "🍿 INFINITE CONTENT",
        "title": "EVERY MOVIE & SHOW EVER MADE",
        "subtitle": "Hollywood • Bollywood • Anime Sub & Dub • Live World Sports",
        "points": [
            "🎬 500,000+ Movies & TV Series in 4K & 1080p Full HD",
            "🎌 Dedicated Anime Engine with Sub & Dub toggles",
            "⚽ Live Sports: Premier League, IPL, Champions League & NBA"
        ],
        "image_key": "movies_poster.png",
        "accent_color": (168, 85, 247),  # Purple
        "badge_bg": (168, 85, 247, 40)
    },
    {
        "id": "scene4_constellation",
        "voice": "What makes CinePulse truly different? Our revolutionary Constellation Engine tests multiple global servers in parallel, auto locking onto the fastest stream in under ten seconds.",
        "badge": "📡 REVOLUTIONARY TECH",
        "title": "CONSTELLATION ENGINE™",
        "subtitle": "Real-Time Parallel Server Racing • Instant Auto-Failover (< 10s)",
        "points": [
            "⚡ Parallel benchmark races across Constellation & Web servers",
            "🛡️ Zero broken links: Auto-switches before you even notice",
            "📶 Live latency monitor: Connects to the lowest-ping CDN"
        ],
        "image_key": "servers_ui.png",
        "accent_color": (16, 185, 129),  # Emerald Green
        "badge_bg": (16, 185, 129, 40)
    },
    {
        "id": "scene5_download",
        "voice": "Introducing universal one-click M-K-V downloads. Enjoy pristine 1080p Full HD with multi threaded range acceleration, up to sixteen times faster.",
        "badge": "📥 1-CLICK DOWNLOADS",
        "title": "UNIVERSAL .MKV DOWNLOAD CENTER",
        "subtitle": "1080p Full HD • Multi-Threaded Range Acceleration • IDM & FDM Ready",
        "points": [
            "📦 Default .MKV Matroska format with multi-audio support",
            "🚀 HTTP 206 Range support: 16x accelerated parallel chunks",
            "⚡ Fast cloud mirrors: Pahe x265, VegaMovies, and Smashy CDN"
        ],
        "image_key": "studios_ui.png",
        "accent_color": (59, 130, 246),  # Blue
        "badge_bg": (59, 130, 246, 40)
    },
    {
        "id": "scene6_features",
        "voice": "Enjoy dedicated Hindi audio hubs, zero intrusive popup ads, and CineBot, your personal AI movie assistant.",
        "badge": "🤖 NEXT-GEN INTELLIGENCE",
        "title": "CINEBOT AI & DEDICATED HINDI HUBS",
        "subtitle": "Smart AI Concierge • Native Regional Dubs • Zero Annoying Popups",
        "points": [
            "🇮🇳 Native Hindi Dubs, Bollywood & regional language hubs",
            "💬 CineBot AI: Ask for plot twists, mood recommendations & trivia",
            "🚫 100% Ad-Free experience: No popups, redirects, or spam"
        ],
        "image_key": "sports_ui.png",
        "accent_color": (245, 158, 11),  # Amber
        "badge_bg": (245, 158, 11, 40)
    },
    {
        "id": "scene7_cta",
        "voice": "Stop paying. Stop waiting. Stream smarter and download faster. Experience CinePulse today.",
        "badge": "🔥 JOIN THE REVOLUTION",
        "title": "EXPERIENCE CINEPULSE TODAY",
        "subtitle": "Web & Android • Completely Free • Stream Without Limits",
        "points": [
            "🌐 Web: Accessible on any desktop, tablet, and mobile browser",
            "📱 Android App: High-performance native Capacitor mobile app",
            "🎉 Upgrade your movie night today. Free forever."
        ],
        "image_key": "logo.png",
        "accent_color": (56, 189, 248),  # Sky Blue
        "badge_bg": (56, 189, 248, 40)
    }
]

def generate_voiceovers():
    print("[1/5] Synthesizing professional voiceovers via Windows SAPI...")
    voice_files = []
    for idx, sc in enumerate(SCENES):
        wav_path = os.path.join(BUILD_DIR, f"{sc['id']}_voice.wav")
        ps_cmd = f'''
        Add-Type -AssemblyName System.Speech
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $synth.SelectVoice("Microsoft David Desktop")
        $synth.Rate = 0
        $synth.Volume = 100
        $synth.SetOutputToWaveFile("{wav_path.replace(os.sep, '/')}")
        $synth.Speak("{sc['voice']}")
        $synth.Dispose()
        '''
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True)
        
        # Get duration using ffprobe
        res = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", wav_path
        ], capture_output=True, text=True, check=True)
        dur = float(res.stdout.strip())
        sc["duration"] = max(dur + 0.8, 5.0)  # Add 0.8s trailing pause
        voice_files.append(wav_path)
        print(f"   Scene {idx+1} ({sc['id']}): {dur:.2f}s voice -> {sc['duration']:.2f}s clip")
    return voice_files

def get_font(size, bold=False):
    font_names = ["arialbd.ttf" if bold else "arial.ttf", "segoeuib.ttf" if bold else "segoeui.ttf"]
    for name in font_names:
        p = os.path.join("C:\\Windows\\Fonts", name)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

def render_scene_slides():
    print("[2/5] Rendering high-resolution 1080p cinematic visual slides...")
    slide_paths = []
    W, H = 1920, 1080

    for idx, sc in enumerate(SCENES):
        # Create rich cinematic gradient canvas
        base = Image.new("RGBA", (W, H), (11, 15, 23, 255))
        draw = ImageDraw.Draw(base)

        # Ambient Glow Gradients (colored radial orbs in corners)
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow)
        ac = sc["accent_color"]
        gdraw.ellipse((-200, -200, 800, 800), fill=(ac[0], ac[1], ac[2], 35))
        gdraw.ellipse((W - 600, H - 600, W + 400, H + 400), fill=(56, 189, 248, 25))
        glow = glow.filter(ImageFilter.GaussianBlur(120))
        base.paste(glow, (0, 0), glow)

        # Subtle Grid / Horizon line
        draw = ImageDraw.Draw(base)
        for y in range(0, H, 120):
            draw.line([(0, y), (W, y)], fill=(255, 255, 255, 6), width=1)
        for x in range(0, W, 160):
            draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 6), width=1)

        # Top Navigation Brand Header
        draw.line([(0, 88), (W, 88)], fill=(255, 255, 255, 18), width=1)
        font_nav = get_font(22, bold=True)
        draw.text((100, 32), "CINEPULSE", font=font_nav, fill=(255, 255, 255, 240))
        draw.text((250, 34), "•  STREAMZONE NETWORK", font=get_font(18, bold=False), fill=(148, 163, 184, 180))

        font_nav_right = get_font(18, bold=True)
        draw.text((W - 380, 34), "OFFICIAL COMMERCIAL", font=font_nav_right, fill=(ac[0], ac[1], ac[2], 240))

        # Left Column: Typography & Feature Highlights (Width: 980px)
        content_x = 100
        content_y = 150

        # Pill Badge
        badge_font = get_font(20, bold=True)
        badge_text = sc["badge"]
        bbox = draw.textbbox((content_x + 16, content_y + 8), badge_text, font=badge_font)
        badge_w = bbox[2] - bbox[0] + 32
        badge_h = 42

        badge_box = Image.new("RGBA", (badge_w, badge_h), (ac[0], ac[1], ac[2], 40))
        bdraw = ImageDraw.Draw(badge_box)
        bdraw.rectangle([(0, 0), (badge_w - 1, badge_h - 1)], outline=(ac[0], ac[1], ac[2], 180), width=2)
        base.paste(badge_box, (content_x, content_y), badge_box)
        draw.text((content_x + 16, content_y + 9), badge_text, font=badge_font, fill=(ac[0], ac[1], ac[2], 255))

        # Main Title (Bold & Crisp)
        title_y = content_y + 65
        title_font = get_font(52, bold=True)
        draw.text((content_x, title_y), sc["title"], font=title_font, fill=(255, 255, 255, 255))

        # Subtitle
        sub_y = title_y + 75
        sub_font = get_font(26, bold=False)
        draw.text((content_x, sub_y), sc["subtitle"], font=sub_font, fill=(148, 163, 184, 255))

        # Feature Highlights Cards
        points_y = sub_y + 65
        pt_font = get_font(24, bold=True)
        for pt in sc["points"]:
            card_w, card_h = 860, 64
            card_img = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 10))
            cdraw = ImageDraw.Draw(card_img)
            cdraw.rectangle([(0, 0), (card_w - 1, card_h - 1)], outline=(255, 255, 255, 25), width=1)
            base.paste(card_img, (content_x, points_y), card_img)
            draw.text((content_x + 24, points_y + 16), pt, font=pt_font, fill=(241, 245, 249, 255))
            points_y += 82

        # Right Column: Visual Mockup / Screen Presentation (Width: 700px, X: 1100)
        img_path = os.path.join(ASSETS_DIR, sc["image_key"])
        if os.path.exists(img_path):
            try:
                mock_src = Image.open(img_path).convert("RGBA")
                # Scale appropriately to fit nicely in 720 x 700 box
                mock_w, mock_h = 720, 680
                mock_src.thumbnail((mock_w, mock_h), Image.Resampling.LANCZOS)
                
                # Create glassmorphic frame with glowing border
                frame_w, frame_h = mock_src.width + 16, mock_src.height + 16
                frame = Image.new("RGBA", (frame_w, frame_h), (15, 23, 42, 220))
                fdraw = ImageDraw.Draw(frame)
                fdraw.rectangle([(0, 0), (frame_w - 1, frame_h - 1)], outline=(ac[0], ac[1], ac[2], 120), width=2)
                frame.paste(mock_src, (8, 8), mock_src)

                # Add shadow
                shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
                sdraw = ImageDraw.Draw(shadow)
                sdraw.rectangle([(20, 20), (frame_w + 20, frame_h + 20)], fill=(0, 0, 0, 160))
                shadow = shadow.filter(ImageFilter.GaussianBlur(18))

                dest_x = 1100 + (720 - frame_w) // 2
                dest_y = 160 + (700 - frame_h) // 2

                base.paste(shadow, (dest_x - 20, dest_y - 20), shadow)
                base.paste(frame, (dest_x, dest_y), frame)
            except Exception as e:
                print(f"Warning: Failed to render mockup {sc['image_key']}: {e}")

        # Bottom Sleek Status Bar
        bot_y = H - 60
        draw.line([(0, bot_y), (W, bot_y)], fill=(255, 255, 255, 14), width=1)
        font_bot = get_font(18, bold=False)
        draw.text((100, bot_y + 18), "⚡ ZERO SUBSCRIPTIONS  •  100% UNRESTRICTED  •  1-CLICK .MKV DOWNLOADS", font=font_bot, fill=(100, 116, 139, 255))
        draw.text((W - 380, bot_y + 18), f"SCENE 0{idx+1} / 0{len(SCENES)}", font=get_font(18, bold=True), fill=(ac[0], ac[1], ac[2], 220))

        slide_path = os.path.join(BUILD_DIR, f"{sc['id']}_slide.png")
        base.convert("RGB").save(slide_path, "PNG", quality=95)
        slide_paths.append(slide_path)
        print(f"   Saved slide {idx+1}: {slide_path}")

    return slide_paths

def generate_cinematic_soundtrack(total_duration):
    print(f"[3/5] Synthesizing cinematic ambient electronic soundtrack ({total_duration:.1f}s)...")
    sr = 44100
    total_samples = int(total_duration * sr)
    t = np.linspace(0, total_duration, total_samples, endpoint=False)

    # Rich lush harmonic chords (C minor / Eb major cinematic chord progression)
    # 4 bars cycling: Cm (C3, Eb3, G3, Bb3) -> Ab (Ab2, C3, Eb3, G3) -> Fm (F2, Ab2, C3, Eb3) -> Bb (Bb2, D3, F3, Ab3)
    bar_dur = 8.0
    audio = np.zeros(total_samples, dtype=np.float32)

    chords = [
        [130.81, 155.56, 196.00, 233.08],  # Cm7
        [103.83, 130.81, 155.56, 196.00],  # Abmaj7
        [87.31, 103.83, 130.81, 155.56],   # Fm7
        [116.54, 146.83, 174.61, 207.65],  # Bb7
    ]

    for i in range(math.ceil(total_duration / bar_dur)):
        c = chords[i % len(chords)]
        t_start = i * bar_dur
        t_end = min((i + 1) * bar_dur, total_duration)
        idx_start = int(t_start * sr)
        idx_end = int(t_end * sr)
        t_segment = t[idx_start:idx_end]

        chord_wave = np.zeros(idx_end - idx_start, dtype=np.float32)
        for freq in c:
            # Warm pad with slight detune and harmonics
            chord_wave += 0.08 * np.sin(2 * np.pi * freq * t_segment)
            chord_wave += 0.04 * np.sin(2 * np.pi * (freq * 1.002) * t_segment)
            chord_wave += 0.02 * np.sin(2 * np.pi * (freq * 2) * t_segment)

        # Apply smooth attack & release envelope to avoid clicks
        env = np.ones(idx_end - idx_start, dtype=np.float32)
        ramp_len = min(int(sr * 0.4), (idx_end - idx_start) // 2)
        if ramp_len > 0:
            env[:ramp_len] = np.linspace(0, 1, ramp_len)
            env[-ramp_len:] = np.linspace(1, 0, ramp_len)

        audio[idx_start:idx_end] += chord_wave * env

    # Sub-bass rhythmic 4/4 pulse (Kick / 808 thud)
    beat_interval = 0.5  # 120 BPM
    num_beats = int(total_duration / beat_interval)
    for b in range(num_beats):
        b_start = int(b * beat_interval * sr)
        b_len = int(0.25 * sr)
        if b_start + b_len < total_samples:
            tb = np.linspace(0, 0.25, b_len)
            pitch_env = np.linspace(120, 45, b_len)
            pulse = 0.18 * np.sin(2 * np.pi * pitch_env * tb) * np.exp(-12 * tb)
            audio[b_start:b_start + b_len] += pulse

    # Ambient hi-hat / cymbal tick every 0.25s
    tick_interval = 0.25
    num_ticks = int(total_duration / tick_interval)
    for k in range(num_ticks):
        k_start = int(k * tick_interval * sr)
        k_len = int(0.04 * sr)
        if k_start + k_len < total_samples:
            noise = (np.random.rand(k_len) - 0.5) * 0.025 * np.exp(-40 * np.linspace(0, 0.04, k_len))
            audio[k_start:k_start + k_len] += noise

    # Master Fade In & Fade Out
    fade_in_len = int(2.0 * sr)
    fade_out_len = int(3.0 * sr)
    audio[:fade_in_len] *= np.linspace(0, 1, fade_in_len)
    audio[-fade_out_len:] *= np.linspace(1, 0, fade_out_len)

    # Normalize volume
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.35  # Set background music level to -12dB relative to voice

    soundtrack_path = os.path.join(BUILD_DIR, "soundtrack.wav")
    wavfile.write(soundtrack_path, sr, audio.astype(np.float32))
    return soundtrack_path

def build_scene_videos():
    print("[4/5] Rendering animated video clips with smooth camera motion...")
    clip_list = []
    
    for idx, sc in enumerate(SCENES):
        slide_path = os.path.join(BUILD_DIR, f"{sc['id']}_slide.png")
        voice_path = os.path.join(BUILD_DIR, f"{sc['id']}_voice.wav")
        clip_path = os.path.join(BUILD_DIR, f"{sc['id']}_clip.mp4")
        dur = sc["duration"]

        # Subtle Ken Burns zoom: scale slowly from 1.0 to 1.04 over duration
        # FFmpeg zoompan filter on 1080p image
        frames_count = int(dur * 30)
        vf = f"zoompan=z='min(zoom+0.0004,1.04)':d={frames_count}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30"

        # Combine slide + voice into a clean MP4 clip
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", slide_path,
            "-i", voice_path,
            "-c:v", "libx264", "-tune", "stillimage",
            "-c:a", "aac", "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-vf", vf,
            "-t", str(dur),
            clip_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clip_list.append(clip_path)
        print(f"   Encoded clip {idx+1}/{len(SCENES)}: {clip_path}")

    return clip_list

def concatenate_and_master(clip_list, soundtrack_path):
    print("[5/5] Mastering final commercial video with synchronized audio & soundtrack...")
    concat_txt = os.path.join(BUILD_DIR, "concat.txt")
    with open(concat_txt, "w") as f:
        for c in clip_list:
            escaped = c.replace("\\", "/")
            f.write(f"file '{escaped}'\n")

    video_only_concat = os.path.join(BUILD_DIR, "combined_video.mp4")

    # Step A: Concatenate all video clips
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_txt,
        "-c", "copy",
        video_only_concat
    ]
    subprocess.run(cmd_concat, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Step B: Mix voiceover with background soundtrack
    final_output = os.path.join(OUTPUT_DIR, "cinepulse_ad_1080p.mp4")
    
    # Audio filter: mix inputs with amix
    cmd_mix = [
        "ffmpeg", "-y",
        "-i", video_only_concat,
        "-i", soundtrack_path,
        "-filter_complex",
        "[0:a]volume=1.3[v];[1:a]volume=0.35[bg];[v][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "256k",
        "-shortest",
        final_output
    ]
    subprocess.run(cmd_mix, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Also generate a web-friendly 720p version for instant mobile viewing
    final_720p = os.path.join(OUTPUT_DIR, "cinepulse_ad_720p.mp4")
    cmd_720 = [
        "ffmpeg", "-y",
        "-i", final_output,
        "-vf", "scale=1280:720",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "copy",
        final_720p
    ]
    subprocess.run(cmd_720, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("\n[SUCCESS] COMMERCIAL GENERATION COMPLETE!")
    print(f">> Full HD 1080p Video: {final_output}")
    print(f">> Mobile 720p Video:  {final_720p}")
    return final_output, final_720p

if __name__ == "__main__":
    clip_files = [os.path.join(BUILD_DIR, f"{sc['id']}_clip.mp4") for sc in SCENES]
    all_clips_exist = all(os.path.exists(c) for c in clip_files)

    if not all_clips_exist:
        voice_files = generate_voiceovers()
        total_dur = sum(s["duration"] for s in SCENES)
        print(f"Total advertisement runtime: {total_dur:.1f} seconds")
        slide_files = render_scene_slides()
        soundtrack_file = generate_cinematic_soundtrack(total_dur)
        clip_files = build_scene_videos()
    else:
        print("[INFO] Reusing existing scene clips and soundtrack...")
        soundtrack_file = os.path.join(BUILD_DIR, "soundtrack.wav")
        if not os.path.exists(soundtrack_file):
            total_dur = sum(s.get("duration", 10.0) for s in SCENES)
            soundtrack_file = generate_cinematic_soundtrack(total_dur)

    out_1080, out_720 = concatenate_and_master(clip_files, soundtrack_file)
    print("Done!")
