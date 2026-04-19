import os
import sys
import glob
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoFileClip, AudioFileClip, concatenate_videoclips, ImageSequenceClip, CompositeAudioClip, AudioArrayClip

def create_countdown_clip(width, height, bg_array, fps=30):
    frames = []
    fps_int = int(fps)
    # Try to load a decent font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", int(height * 0.4))
    except:
        font = ImageFont.load_default()
        
    base_bg = Image.fromarray(bg_array).convert('RGBA')
    overlay = Image.new('RGBA', base_bg.size, (0, 0, 0, 150))
    base_bg = Image.alpha_composite(base_bg, overlay)
        
    for i in range(3, 0, -1):
        for frame_idx in range(fps_int):
            img = base_bg.copy()
            draw = ImageDraw.Draw(img)
            text = str(i)
            # Center the text
            bbox = draw.textbbox((0, 0), text, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            x = int((width - tw) / 2)
            y = int((height - th) / 2 - height * 0.1) # shift up slightly
            
            # Simple fade out
            alpha = max(0, min(255, int(255 * (1 - frame_idx / fps))))
            color = (255, max(100, alpha), max(100, alpha))
            
            draw.text((x, y), text, fill=color, font=font)
            frames.append(np.array(img.convert('RGB')))
            
    return ImageSequenceClip(frames, fps=fps_int)

def generate_cheer(duration, fps=44100):
    t = np.linspace(0, duration, int(duration * fps), endpoint=False)
    noise = np.random.normal(0, 0.4, len(t))
    ramp = np.ones_like(noise)
    # fade in over 0.5s
    fade_in = min(len(ramp), int(0.5 * fps))
    ramp[:fade_in] = np.linspace(0, 1, fade_in)
    # fade out over 1s
    fade_out = min(len(ramp), int(1.0 * fps))
    ramp[-fade_out:] = np.linspace(1, 0, fade_out)
    
    stereo = np.vstack((noise * ramp, noise * ramp)).T
    return AudioArrayClip(stereo, fps=fps)

def generate_clack(fps=44100):
    # A tiny "pop" noise for a ball collision
    duration = 0.05
    t = np.linspace(0, duration, int(duration * fps), endpoint=False)
    noise = np.random.normal(0, 0.5, len(t))
    envelope = np.exp(-40 * t) # very fast decay
    clack = noise * envelope * 0.7 
    stereo = np.vstack((clack, clack)).T
    return AudioArrayClip(stereo, fps=fps)

def main():
    recordings_dir = "recordings"
    output_dir = "final versions"
    os.makedirs(output_dir, exist_ok=True)
    
    videos = sorted(glob.glob(os.path.join(recordings_dir, "*.mp4")))
    if not videos:
        print("No recordings found in 'recordings' directory.")
        return
        
    # Discover next final version index
    existing_finals = glob.glob(os.path.join(output_dir, "final version *.mp4"))
    max_index = 0
    for f in existing_finals:
        base = os.path.basename(f)
        try:
            # extract number from 'final version X.mp4'
            num_str = base.replace("final version ", "").replace(".mp4", "")
            max_index = max(max_index, int(num_str))
        except ValueError:
            pass

    next_index = max_index + 1

    for vid_path in videos:
        out_name = f"final version {next_index}.mp4"
        out_path = os.path.join(output_dir, out_name)
        
        print(f"\nProcessing {vid_path} -> {out_name}")
        
        try:
            main_clip = VideoFileClip(vid_path)
            
            # The first frame of the game
            bg_frame = main_clip.get_frame(0)
            countdown_clip = create_countdown_clip(main_clip.w, main_clip.h, bg_frame, fps=main_clip.fps)
            
            # The win happens exactly 120 frames before the end of the recording.
            # At 60 FPS, this is 2 seconds.
            freeze_duration = 120 / main_clip.fps
            cheer_start_time = max(0, main_clip.duration - freeze_duration)
            
            # Use dynamically generated cheer noise
            cheer_audio = generate_cheer(freeze_duration, fps=44100).with_start(cheer_start_time)
            
            audio_clips = []
            if main_clip.audio is not None:
                audio_clips.append(main_clip.audio)
                
            audio_clips.append(cheer_audio)
            
            # Read collision data from sidecar JSON
            json_path = vid_path.replace('.mp4', '.json')
            if os.path.exists(json_path):
                import json
                with open(json_path, 'r') as f:
                    data = json.load(f)
                    collision_times = data.get("collisions", [])
                
                clack_base = generate_clack(fps=44100)
                for ts in collision_times:
                    audio_clips.append(clack_base.with_start(ts))
            
            mixed_audio = CompositeAudioClip(audio_clips)
            main_clip = main_clip.with_audio(mixed_audio)
            
            # Concatenate countdown + main clip
            final_clip = concatenate_videoclips([countdown_clip, main_clip])
            
            print(f"Rendering {out_name}...")
            # We must set logger=None or supply one, defaults usually print stdout
            final_clip.write_videofile(
                out_path, 
                codec="libx264", 
                audio_codec="aac", 
                fps=main_clip.fps,
                threads=4
            )
            
            main_clip.close()
            countdown_clip.close()
            final_clip.close()
            
            # Move or rename the original so it isn't processed again? 
            # Or just increment next_index since we save as final version N
            next_index += 1
            
            # Rename the original recording to mark it as processed
            os.rename(vid_path, vid_path + ".processed")
            print(f"Marked {vid_path} as processed.")
            
        except Exception as e:
            print(f"Error processing {vid_path}: {e}")

if __name__ == "__main__":
    main()
