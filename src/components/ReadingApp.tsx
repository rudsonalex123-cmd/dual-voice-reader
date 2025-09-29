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

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

interface ProcessedWord {
  word: string;
  language: string;
  index: number;
}

const ReadingApp = () => {
  const availableLanguages: LanguageOption[] = [
    { code: 'pt', name: 'Português Brasileiro', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
    { code: 'en', name: 'Inglês', flag: '🇺🇸' },
    { code: 'fr', name: 'Francês', flag: '🇫🇷' },
    { code: 'de', name: 'Alemão', flag: '🇩🇪' }
  ];

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
  const [activeLanguages, setActiveLanguages] = useState<string[]>(['pt', 'fr']);
  const [selectedVoices, setSelectedVoices] = useState<{ [key: string]: string }>({});
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [speed, setSpeed] = useState([1.3]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [processedWords, setProcessedWords] = useState<ProcessedWord[]>([]);
  
  const textRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const voiceOptions: VoiceOption[] = [];
      
      // Filter voices for all supported languages
      availableVoices.forEach(voice => {
        if (voice.lang.startsWith('pt')) {
          voiceOptions.push({
            voice,
            language: 'pt',
            displayName: `🇧🇷 ${voice.name}`
          });
        } else if (voice.lang.startsWith('it')) {
          voiceOptions.push({
            voice,
            language: 'it',
            displayName: `🇮🇹 ${voice.name}`
          });
        } else if (voice.lang.startsWith('es')) {
          voiceOptions.push({
            voice,
            language: 'es',
            displayName: `🇪🇸 ${voice.name}`
          });
        } else if (voice.lang.startsWith('en')) {
          voiceOptions.push({
            voice,
            language: 'en',
            displayName: `🇺🇸 ${voice.name}`
          });
        } else if (voice.lang.startsWith('fr')) {
          voiceOptions.push({
            voice,
            language: 'fr',
            displayName: `🇫🇷 ${voice.name}`
          });
        } else if (voice.lang.startsWith('de')) {
          voiceOptions.push({
            voice,
            language: 'de',
            displayName: `🇩🇪 ${voice.name}`
          });
        }
      });
      
      setVoices(voiceOptions);
      
      // Set default voices for active languages
      const defaultVoices: { [key: string]: string } = {};
      activeLanguages.forEach(lang => {
        const voice = voiceOptions.find(v => v.language === lang);
        if (voice) {
          defaultVoices[lang] = voice.voice.name;
        }
      });
      setSelectedVoices(defaultVoices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [activeLanguages]);

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
    const lowerWord = word.toLowerCase().replace(/[^a-zàâäèéêëîïôöùûüÿç-]/g, '');
    
    // Language-specific word patterns
    const languagePatterns = {
      fr: {
        words: ['père', 'mère', 'fils', 'fille', 'frère', 'sœur', 'grand-père', 'grand-mère', 'petit-fils', 'petite-fille', 'et', 'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'dans', 'avec', 'pour', 'sur', 'très', 'bien', 'tout', 'tous', 'aussi', 'comme', 'alors', 'mais', 'où', 'comment', 'quand', 'qui', 'que', 'dont', 'cette', 'ces', 'son', 'sa', 'ses', 'notre', 'nos', 'leur', 'leurs'],
        chars: ['ç', 'è', 'é', 'ê', 'ë', 'à', 'â', 'î', 'ï', 'ô', 'û', 'ù', 'ÿ']
      },
      it: {
        words: ['padre', 'madre', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna', 'nipote', 'e', 'il', 'la', 'lo', 'gli', 'le', 'un', 'una', 'uno', 'di', 'del', 'della', 'dello', 'dei', 'delle', 'degli', 'in', 'con', 'per', 'su', 'molto', 'bene', 'tutto', 'tutti', 'anche', 'come', 'allora', 'ma', 'dove', 'quando', 'chi', 'che', 'cui', 'questa', 'questo', 'questi', 'queste', 'suo', 'sua', 'suoi', 'sue', 'nostro', 'nostra', 'nostri', 'nostre', 'loro'],
        chars: ['à', 'è', 'é', 'ì', 'í', 'î', 'ò', 'ó', 'ô', 'ù', 'ú', 'û']
      },
      es: {
        words: ['padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela', 'nieto', 'nieta', 'y', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'con', 'para', 'por', 'sobre', 'muy', 'bien', 'todo', 'todos', 'también', 'como', 'entonces', 'pero', 'dónde', 'cuándo', 'quién', 'que', 'esta', 'este', 'estos', 'estas', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras'],
        chars: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']
      },
      en: {
        words: ['father', 'mother', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandson', 'granddaughter', 'and', 'the', 'a', 'an', 'of', 'in', 'with', 'for', 'on', 'very', 'well', 'all', 'also', 'as', 'then', 'but', 'where', 'when', 'who', 'that', 'this', 'these', 'his', 'her', 'their', 'our'],
        chars: []
      },
      de: {
        words: ['vater', 'mutter', 'sohn', 'tochter', 'bruder', 'schwester', 'großvater', 'großmutter', 'enkel', 'enkelin', 'und', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines', 'von', 'in', 'mit', 'für', 'auf', 'sehr', 'gut', 'alle', 'auch', 'wie', 'dann', 'aber', 'wo', 'wann', 'wer', 'dass', 'diese', 'dieser', 'dieses', 'sein', 'seine', 'ihr', 'ihre', 'unser', 'unsere'],
        chars: ['ä', 'ö', 'ü', 'ß']
      }
    };

    // Check each active language
    for (const lang of activeLanguages) {
      if (languagePatterns[lang as keyof typeof languagePatterns]) {
        const pattern = languagePatterns[lang as keyof typeof languagePatterns];
        
        // Check for exact word matches
        if (pattern.words.some(w => lowerWord === w || lowerWord.includes(w))) {
          return lang;
        }
        
        // Check for language-specific characters
        if (pattern.chars.some(char => word.includes(char))) {
          return lang;
        }
      }
    }
    
    // Default to first active language
    return activeLanguages[0] || 'pt';
  };

  const speakText = () => {
    if (isPlaying) {
      isSpeakingRef.current = false;
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setCurrentUtterance(null);
      return;
    }

    if (processedWords.length === 0) return;

    setIsPlaying(true);
    isSpeakingRef.current = true;
    let wordIndex = 0;

    const speakNextWord = () => {
      if (wordIndex >= processedWords.length || !isSpeakingRef.current) {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        setCurrentUtterance(null);
        isSpeakingRef.current = false;
        return;
      }

      const processedWord = processedWords[wordIndex];
      const selectedVoiceName = selectedVoices[processedWord.language];
      
      if (!selectedVoiceName) {
        wordIndex++;
        setTimeout(() => speakNextWord(), 50);
        return;
      }

      const voice = voices.find(v => v.voice.name === selectedVoiceName)?.voice;
      
      if (!voice) {
        wordIndex++;
        setTimeout(() => speakNextWord(), 50);
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
        if (isSpeakingRef.current) {
          wordIndex++;
          setTimeout(() => speakNextWord(), 100);
        }
      };

      utterance.onerror = () => {
        if (isSpeakingRef.current) {
          wordIndex++;
          setTimeout(() => speakNextWord(), 50);
        }
      };

      speechSynthesis.speak(utterance);
    };

    speakNextWord();
  };

  const stopReading = () => {
    isSpeakingRef.current = false;
    setIsPlaying(false);
    speechSynthesis.cancel();
    setCurrentWordIndex(-1);
    setCurrentUtterance(null);
  };

  const handleLanguageChange = (index: number, language: string) => {
    const newActiveLanguages = [...activeLanguages];
    newActiveLanguages[index] = language;
    setActiveLanguages(newActiveLanguages);
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
            processedWord.language !== activeLanguages[0]
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
          {/* Language Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Idiomas Ativos (Selecione 2)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLanguages.map((activeLang, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Idioma {index + 1}
                  </label>
                  <Select
                    value={activeLang}
                    onValueChange={(value) => handleLanguageChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {activeLanguages.map((lang, index) => {
              const langInfo = availableLanguages.find(l => l.code === lang);
              return (
                <div key={lang}>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    {langInfo?.flag} Voz {langInfo?.name}
                  </label>
                  <Select
                    value={selectedVoices[lang] || ''}
                    onValueChange={(value) => setSelectedVoices(prev => ({ ...prev, [lang]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices
                        .filter(v => v.language === lang)
                        .map(v => (
                          <SelectItem key={v.voice.name} value={v.voice.name}>
                            {v.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
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
                  ({availableLanguages.find(l => l.code === processedWords[currentWordIndex].language)?.flag} {availableLanguages.find(l => l.code === processedWords[currentWordIndex].language)?.name})
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