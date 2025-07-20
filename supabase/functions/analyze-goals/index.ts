
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, currentGoals, preferences } = await req.json();

    const geminiApiKey = 'AIzaSyC1BpwyhDXP6jq7Ej5he1xsXZYFMNcabU8';
    
    const prompt = `
    You are an AI coding mentor analyzing a developer's profile to suggest personalized learning goals.
    
    User Profile:
    - Current XP: ${userProfile.totalXP || 0}
    - Current Streak: ${userProfile.currentStreak || 0} days
    - Existing Goals: ${currentGoals?.length || 0} goals
    - Programming Interests: ${preferences?.languages || 'General programming'}
    - Experience Level: ${userProfile.totalXP > 1000 ? 'Advanced' : userProfile.totalXP > 500 ? 'Intermediate' : 'Beginner'}
    
    Current Goals:
    ${currentGoals?.map((goal: any) => `- ${goal.title}: ${goal.description || 'No description'}`).join('\n') || 'No current goals'}
    
    Please suggest 3-5 personalized coding goals that would help this developer grow. For each goal, provide:
    1. Title (concise, actionable)
    2. Description (detailed explanation of what to do)
    3. XP Reward (between 25-100 based on difficulty)
    4. Estimated Duration (in days)
    5. Category (Frontend, Backend, DevOps, Data Structures, etc.)
    
    Focus on:
    - Progressive difficulty based on their current level
    - Practical, project-based goals
    - Skills that complement their existing knowledge
    - Goals that encourage consistent daily practice
    
    Respond in JSON format:
    {
      "goals": [
        {
          "title": "Goal Title",
          "description": "Detailed description of what to accomplish",
          "xp_reward": 50,
          "estimated_days": 7,
          "category": "Frontend",
          "difficulty": "Intermediate"
        }
      ],
      "analysis": "Brief analysis of the developer's current state and why these goals were chosen"
    }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, create a structured response from the text
      parsedResponse = {
        goals: [
          {
            title: "Complete AI-Suggested Coding Challenge",
            description: generatedText,
            xp_reward: 50,
            estimated_days: 7,
            category: "General",
            difficulty: "Intermediate"
          }
        ],
        analysis: "AI analysis completed successfully"
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze-goals function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze goals', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
