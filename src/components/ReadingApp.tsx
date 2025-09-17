import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, BookOpen } from 'lucide-react';

interface VoiceOption {
  voice: SpeechSynthesisVoice;
  language: string;
  displayName: string;
}

interface ProcessedWord {
  word: string;
  language: string;
  index: number;
}

const ReadingApp = () => {
  const [text, setText] = useState(`Hoje vamos aprender os nomes da família em francês. É um vocabulário fundamental e muito útil para qualquer conversa.

Assim como em português, temos o masculino e o feminino, e o singular e o plural. Vamos ver os mais comuns:

Os parentes mais próximos:

Pai: Père

Mãe: Mère

Filho: Fils

Filha: Fille

Irmão: Frère

Irmã: Sœur

Avô: Grand-père

Avó: Grand-mère

Neto: Petit-fils

Neta: Petite-fille`);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoices, setSelectedVoices] = useState<{ [key: string]: string }>({
    'pt': '',
    'fr': ''
  });
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [speed, setSpeed] = useState([1]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [processedWords, setProcessedWords] = useState<ProcessedWord[]>([]);
  
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const voiceOptions: VoiceOption[] = [];
      
      // Filter voices for Portuguese and French only
      availableVoices.forEach(voice => {
        if (voice.lang.startsWith('pt')) {
          voiceOptions.push({
            voice,
            language: 'pt',
            displayName: `🇧🇷 ${voice.name}`
          });
        } else if (voice.lang.startsWith('fr')) {
          voiceOptions.push({
            voice,
            language: 'fr',
            displayName: `🇫🇷 ${voice.name}`
          });
        }
      });
      
      setVoices(voiceOptions);
      
      // Set default voices
      if (voiceOptions.length > 0) {
        const ptVoice = voiceOptions.find(v => v.language === 'pt');
        const frVoice = voiceOptions.find(v => v.language === 'fr');
        
        setSelectedVoices({
          'pt': ptVoice?.voice.name || '',
          'fr': frVoice?.voice.name || ''
        });
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Pre-process text to identify languages
  useEffect(() => {
    const words = text.split(/\s+/).filter(word => word.trim() !== '');
    const processed: ProcessedWord[] = words.map((word, index) => ({
      word,
      language: detectLanguage(word),
      index
    }));
    setProcessedWords(processed);
  }, [text]);

  const detectLanguage = (word: string): string => {
    // Simple language detection based on common patterns
    const frenchWords = ['père', 'mère', 'fils', 'fille', 'frère', 'sœur', 'grand-père', 'grand-mère', 'petit-fils', 'petite-fille'];
    const lowerWord = word.toLowerCase().replace(/[^a-zàâäèéêëîïôöùûüÿç-]/g, '');
    
    if (frenchWords.some(fw => lowerWord.includes(fw))) {
      return 'fr';
    }
    
    // Check for French characteristics
    if (word.includes('ç') || word.includes('è') || word.includes('é') || word.includes('ê') || word.includes('ë') || word.includes('à') || word.includes('â') || word.includes('î') || word.includes('ô') || word.includes('û')) {
      return 'fr';
    }
    
    return 'pt'; // Default to Portuguese
  };

  const speakText = () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setCurrentUtterance(null);
      return;
    }

    if (processedWords.length === 0) return;

    setIsPlaying(true);
    let wordIndex = 0;

    const speakNextWord = () => {
      if (wordIndex >= processedWords.length || !isPlaying) {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        setCurrentUtterance(null);
        return;
      }

      const processedWord = processedWords[wordIndex];
      const selectedVoiceName = selectedVoices[processedWord.language];
      
      if (!selectedVoiceName) {
        wordIndex++;
        setTimeout(speakNextWord, 50);
        return;
      }

      const voice = voices.find(v => v.voice.name === selectedVoiceName)?.voice;
      
      if (!voice) {
        wordIndex++;
        setTimeout(speakNextWord, 50);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(processedWord.word);
      utterance.voice = voice;
      utterance.rate = speed[0];
      utterance.pitch = 1;
      utterance.volume = 1;

      setCurrentWordIndex(wordIndex);
      setCurrentUtterance(utterance);

      utterance.onend = () => {
        if (isPlaying) {
          wordIndex++;
          setTimeout(speakNextWord, 150);
        }
      };

      utterance.onerror = () => {
        if (isPlaying) {
          wordIndex++;
          setTimeout(speakNextWord, 50);
        }
      };

      speechSynthesis.speak(utterance);
    };

    speakNextWord();
  };

  const stopReading = () => {
    setIsPlaying(false);
    speechSynthesis.cancel();
    setCurrentWordIndex(-1);
    setCurrentUtterance(null);
  };

  const renderHighlightedText = () => (
    <div className="leading-relaxed text-lg">
      {processedWords.map((processedWord, index) => (
        <span
          key={index}
          className={`${
            index === currentWordIndex
              ? 'bg-reading-highlight px-1 py-0.5 rounded transition-all duration-300'
              : ''
          } ${
            processedWord.language === 'fr'
              ? 'text-languages-french font-medium'
              : 'text-reading-text'
          }`}
        >
          {processedWord.word}{' '}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-reading p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Leitor Multilíngue
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Aprenda idiomas com leitura em voz alta inteligente
          </p>
        </div>

        {/* Controls */}
        <Card className="p-6 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                🇧🇷 Voz Portuguesa
              </label>
              <Select
                value={selectedVoices.pt}
                onValueChange={(value) => setSelectedVoices(prev => ({ ...prev, pt: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma voz" />
                </SelectTrigger>
                <SelectContent>
                  {voices
                    .filter(v => v.language === 'pt')
                    .map(v => (
                      <SelectItem key={v.voice.name} value={v.voice.name}>
                        {v.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                🇫🇷 Voz Francesa
              </label>
              <Select
                value={selectedVoices.fr}
                onValueChange={(value) => setSelectedVoices(prev => ({ ...prev, fr: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma voz" />
                </SelectTrigger>
                <SelectContent>
                  {voices
                    .filter(v => v.language === 'fr')
                    .map(v => (
                      <SelectItem key={v.voice.name} value={v.voice.name}>
                        {v.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Velocidade:</span>
            </div>
            <div className="flex-1 max-w-48">
              <Slider
                value={speed}
                onValueChange={setSpeed}
                max={2}
                min={0.5}
                step={0.1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground">{speed[0]}x</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={speakText} size="lg" className="shadow-soft">
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Reproduzir
                </>
              )}
            </Button>
            
            <Button 
              onClick={stopReading} 
              variant="outline" 
              size="lg"
              disabled={!isPlaying}
            >
              <Square className="w-5 h-5 mr-2" />
              Parar
            </Button>
          </div>
        </Card>

        {/* Text Input */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Texto para Leitura</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole seu texto aqui..."
            className="min-h-32 text-base leading-relaxed"
          />
        </Card>

        {/* Reading Display */}
        <Card className="p-8 shadow-soft bg-reading-bg border-2">
          <h3 className="text-xl font-semibold mb-6 text-reading-text">Texto em Leitura</h3>
          <div ref={textRef} className="prose max-w-none">
            {renderHighlightedText()}
          </div>
          
          {currentWordIndex >= 0 && processedWords[currentWordIndex] && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Lendo palavra {currentWordIndex + 1} de {processedWords.length}: 
                <span className="font-semibold text-primary"> "{processedWords[currentWordIndex].word}"</span>
                <span className="text-xs ml-2">
                  ({processedWords[currentWordIndex].language === 'fr' ? '🇫🇷 Francês' : '🇧🇷 Português'})
                </span>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReadingApp;