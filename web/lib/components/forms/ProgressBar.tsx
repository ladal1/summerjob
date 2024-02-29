import { useEffect, useState } from 'react'

interface ProgressBarProps {
  time: number // Time in milliseconds for the progress bar completion
}

export const ProgressBar = ({ time }: ProgressBarProps) => {
  const [progress, setProgress] = useState(0)

  const delay = 100
  // Calculate progress increment based on the desired time
  // because of setInterval and delay = 100, we will call updateProgress (time/delay)x, so we calculate acordingly, +1 is here because last wouldn't be otherwise seen
  const increment = Math.ceil(delay / (time / 100)) + 1

  useEffect(() => {
    if(time <= 100) {
      return
    }

    // Update progress at regular intervals
    const updateProgress = () => {
      setProgress((prevProgress) => Math.min(prevProgress + increment, 100))
    }

    // Start updating progress
    const intervalId = setInterval(updateProgress, delay)

    // Clear interval and reset progress on component unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [increment, delay, time])

  return (
    <div className="progress">
      <div
        className="progress-bar smj-progress-bar"
        role="progressbar"
        style={{ 
          width: `${progress}%`,
        }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
      </div>
    </div>
  )
}