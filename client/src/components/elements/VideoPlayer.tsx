import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
} from "@mui/icons-material";
import { RootState } from "@/redux/store";
import { toggleAutoplayVideosWithAudio } from "@/redux/slices/preferenceSlice";

interface VideoPlayerProps {
  src: string;
  thumbnail: string;
  autoPlay?: boolean;
  isCurrentIndex?: boolean;
  onClick?: () => void;
  showControls?: boolean;
  fullViewport?: boolean;
}

export default function VideoPlayer({
  src,
  thumbnail,
  autoPlay = false,
  isCurrentIndex = true,
  onClick,
  showControls: showControlsProp = true,
  fullViewport = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dispatch = useDispatch();
  const autoplayVideosWithAudio = useSelector((state: RootState) => state.preference.autoplayVideosWithAudio);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(showControlsProp);
  const [isInView, setIsInView] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || fullViewport) return;

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.5 });

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, [fullViewport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (fullViewport) {
      if (autoPlay) {
        video.play().catch();
      }
    } else {
      if (isInView && isCurrentIndex) {
        video.play().catch();
      } else {
        video.pause();
      }
    }
  }, [isInView, isCurrentIndex, autoPlay, fullViewport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }

  function handleSeek(value: number) {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value;
    setCurrentTime(value);
  }

  function handleVolumeChange(value: number) {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    setVolume(value);
  }

  function toggleMute() {
    dispatch(toggleAutoplayVideosWithAudio());
  }

  function toggleFullscreen() {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  }

  function formatTime(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function resetControlsTimer() {
    if (!showControlsProp) return;

    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    setShowControls(true);

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    setControlsTimeout(timeout);
  }

  function clearControlsTimer() {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }
  }

  function handleVideoClick() {
    if (onClick) {
      onClick();
    } else {
      togglePlay();
    }
    resetControlsTimer();
  }

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      bgcolor={fullViewport ? "black" : "black"}
      onMouseEnter={() => showControlsProp && resetControlsTimer()}
      onMouseMove={() => showControlsProp && resetControlsTimer()}
      onMouseLeave={() => {
        if (showControlsProp) {
          clearControlsTimer();
          setShowControls(false);
        }
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        src={src}
        muted={!autoplayVideosWithAudio}
        // loop={!fullViewport}
        preload="none"
        poster={thumbnail}
        playsInline
        onClick={handleVideoClick}
        sx={{
          width: "100%",
          height: fullViewport ? "100vh" : 350,
          maxHeight: "100vh",
          objectFit: fullViewport ? "contain" : "cover",
          cursor: onClick ? "pointer" : "default",
          borderRadius: fullViewport ? 0 : 2,
          // border: fullViewport ? "none" : "2px solid",
          // borderColor: "divider",
          mb: -1,
        }}
      />

      {showControls && (!isPlaying || showControlsProp) && (
        <Box position="absolute" bottom={0} left={0} right={0} bgcolor="rgba(0, 0, 0, 0.7)" p={fullViewport ? 2 : 0}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={() => {
                togglePlay();
                resetControlsTimer();
              }}
              sx={{ color: "white" }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            <Typography variant="body2" color="white" minWidth={50}>
              {formatTime(currentTime)}
            </Typography>

            <Slider
              value={currentTime}
              max={duration}
              onChange={(_e, value) => {
                handleSeek(value as number);
                resetControlsTimer();
              }}
              sx={{
                flex: 1,
                color: "white",
                "& .MuiSlider-thumb": {
                  bgcolor: "white",
                },
                "& .MuiSlider-track": {
                  bgcolor: "white",
                },
                "& .MuiSlider-rail": {
                  bgcolor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            />

            <Typography variant="body2" color="white" minWidth={50} ml={2}>
              {formatTime(duration)}
            </Typography>

            <IconButton
              onClick={() => {
                toggleMute();
                resetControlsTimer();
              }}
              sx={{ color: "white" }}
            >
              {!autoplayVideosWithAudio ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Slider
              value={!autoplayVideosWithAudio ? 0 : volume}
              max={1}
              step={0.1}
              onChange={(_, value) => {
                handleVolumeChange(value as number);
                resetControlsTimer();
              }}
              sx={{
                display: "none",
                width: 80,
                color: "white",
                "& .MuiSlider-thumb": {
                  bgcolor: "white",
                },
                "& .MuiSlider-track": {
                  bgcolor: "white",
                },
                "& .MuiSlider-rail": {
                  bgcolor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            />

            <IconButton
              onClick={() => {
                toggleFullscreen();
                resetControlsTimer();
              }}
              sx={{ color: "white" }}
            >
              <FullscreenIcon sx={{ display: "none" }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
