import * as Constants from './constants';
import EngagementGraph from './EngagementGraph';
import EmotionDistributionChart from './EmotionDistributionChart';
import AttentionProportionChart from './AttentionProportionChart';
import "./App.css";
import StudentPage from "./pages/StudentPage";


function App() {

  const attentionData = [];
  // const slideData = [];

  // // Generate 10 slide timestamps
  // for (let i = 0; i < 10; i++) {
  //   slideData.push({
  //     timestamp: i * 60000 // Each slide lasts 1 minute (60000 milliseconds)
  //   });
  // }

  // Generate 500 attention data points
  for (let i = 0; i < 500; i++) {
    attentionData.push({
      ifLooking: Math.random() < 0.7, // 70% chance of looking
      timestamp: Math.floor(Math.random() * 600000) // Random timestamp within 10 minutes
    });
  }

  // Sort attentionData by timestamp
  attentionData.sort((a, b) => a.timestamp - b.timestamp);

  
  function generateMockData() {
    const emotionData = [];
    const slideData = [];
    
    // Generate 10 slide timestamps
    for (let i = 0; i < 10; i++) {
      slideData.push({
        timestamp: i * 60000 // Each slide lasts 1 minute (60000 milliseconds)
      });
    }
    
    // Helper function to generate a random emotion with some bias
    function generateRandomEmotion(slideIndex) {
      // Base probabilities
      const probabilities = [
        0.2,  // 0-9: More likely (neutral emotions)
        0.15, // 10-19: Somewhat likely
        0.1,  // 20-29: Less likely
        0.05, // 30-39: Rare
        0.01  // 40-45: Very rare (extreme emotions)
      ];
      
      // Adjust probabilities based on slide index to create some trends
      const adjustedProbabilities = probabilities.map((p, i) => {
        if (slideIndex < 3) return p; // Start of presentation: normal distribution
        if (slideIndex >= 3 && slideIndex < 7) {
          // Middle of presentation: slightly more engaged
          return i === 1 ? p * 1.2 : p;
        }
        // End of presentation: more varied emotions
        return i === 2 || i === 3 ? p * 1.3 : p;
      });
      
      const rand = Math.random();
      let cumulativeProbability = 0;
      for (let i = 0; i < adjustedProbabilities.length; i++) {
        cumulativeProbability += adjustedProbabilities[i];
        if (rand < cumulativeProbability) {
          return Math.floor(Math.random() * 10) + i * 10;
        }
      }
      return 45; // Fallback to the last emotion
    }
    
    // Generate 500 emotion data points
    for (let i = 0; i < 500; i++) {
      const timestamp = Math.floor(Math.random() * 600000); // Random timestamp within 10 minutes
      const slideIndex = Math.floor(timestamp / 60000); // Determine which slide this emotion belongs to
      
      emotionData.push({
        emotion: generateRandomEmotion(slideIndex),
        timestamp: timestamp
      });
    }
    
    // Sort emotionData by timestamp
    emotionData.sort((a, b) => a.timestamp - b.timestamp);
    
    return { emotionData, slideData };
  }

  function generateMockStudentData(duration, studentCount = 20) {
    const studentsAttentionData = [];
  
    for (let i = 0; i < studentCount; i++) {
      const studentData = [];
      let lastTimestamp = 0;
      let isLooking = Math.random() < 0.7; // 70% chance of starting paying attention
  
      while (lastTimestamp < duration) {
        studentData.push({
          ifLooking: isLooking,
          timestamp: lastTimestamp
        });
  
        // Random time until next attention change (between 5 and 30 seconds)
        const timeUntilChange = Math.random() * 25000 + 5000;
        lastTimestamp += timeUntilChange;
  
        // 30% chance of changing attention state
        if (Math.random() < 0.3) {
          isLooking = !isLooking;
        }
      }
  
      studentsAttentionData.push(studentData);
    }
  
    return studentsAttentionData;
  }

  
  const { emotionData, slideData } = generateMockData();
  console.log(emotionData.slice(0, 10)); // Display first 10 elements
  console.log(`Total emotion data points: ${emotionData.length}`);
  console.log(`Number of slides: ${slideData.length}`);

  const duration = 600000; // 10 minutes in milliseconds
  const studentsAttentionData = generateMockStudentData(duration);

  return (
    <div className="w-screen h-screen bg-primary-600 flex text-primary-100 font-work">
      <StudentPage />
    </div>
  );
}

export default App;
