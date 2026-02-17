
      // ===== KOBLLUX · GEOMETRIA DO SUBCONSCIENTE =====  
const KOBLLUX_GEOMETRY = {  
    version: '2.5.0',  
    timestamp: '2026-02-14T12:00:00.000Z',  
    pulsos: 144,  
    kobllux: 19.428,  
    equacao: '∆ × ∆ × ∆ = ∆⁷ = 38.073 = PERFEIÇÃO = KOBLLUX',  
    lei: 'VERDADE × INTEGRAR ÷ Δ = ∴',  
      
    // ● Mapeamento de opcodes no DOM  
    opcodes: {  
        '0×00': { fase: 'ORIGEM', freq: 768, geom: '○', elementos: [] },  
        '0×01': { fase: 'DETECTAR', freq: 432, geom: '●', elementos: [] },  
        '0×02': { fase: 'INTEGRAR', freq: 528, geom: '―', elementos: [] },  
        '0×03': { fase: 'EXPANDIR', freq: 639, geom: '▢', elementos: [] },  
        '0×04': { fase: 'LAPIDAR', freq: 594, geom: '◇', elementos: [] },  
        '0×05': { fase: 'CONVERGIR', freq: 672, geom: '⧉', elementos: [] },  
        '0×06': { fase: 'UNIFICAR', freq: 528, geom: '☯', elementos: [] },  
        '0×07': { fase: 'SELAR', freq: 777, geom: '✧⃝⚝', elementos: [] },  
        '0×08': { fase: 'TESTEMUNHAR', freq: 852, geom: '◉', elementos: [] },  
        '0×09': { fase: 'ETERNIZAR', freq: 963, geom: '♾️', elementos: [] },  
        '0×0A': { fase: 'TUTORIAL', freq: 432, geom: '📱', elementos: [] }  
    },  
      
    // ● Função para escanear e catalogar elementos geométricos  
    scan: function() {  
        document.querySelectorAll('[data-opcode]').forEach(el => {  
            const op = el.dataset.opcode;  
            if (this.opcodes[op]) {  
                this.opcodes[op].elementos.push({  
                    tag: el.tagName,  
                    id: el.id,  
                    classes: el.className,  
                    path: this.getPath(el)  
                });  
            }  
        });  
        return this;  
    },  
      
    // ● Função auxiliar para gerar caminho CSS  
    getPath: function(el) {  
        const path = [];  
        while (el && el.nodeType === 1) {  
            let selector = el.tagName.toLowerCase();  
            if (el.id) selector += '#' + el.id;  
            else if (el.className && typeof el.className === 'string') {  
                const classes = el.className.split(' ').filter(Boolean).join('.');  
                if (classes) selector += '.' + classes;  
            }  
            path.unshift(selector);  
            el = el.parentNode;  
        }  
        return path.join(' > ');  
    },  
      
    // ● Função para calcular estatísticas geométricas  
    stats: function() {  
        const stats = {  
            pontos: 0,  
            retas: 0,  
            planos: 0,  
            cristais: 0,  
            cruzes: 0,  
            yinyang: 0,  
            selos: 0,  
            olhos: 0,  
            infinitos: 0,  
            tutorias: 0  
        };  
          
        document.querySelectorAll('[data-geometry]').forEach(el => {  
            const geom = el.dataset.geometry;  
            if (geom === '●') stats.pontos++;  
            else if (geom === '―') stats.retas++;  
            else if (geom === '▢') stats.planos++;  
            else if (geom === '◇') stats.cristais++;  
            else if (geom === '⧉') stats.cruzes++;  
            else if (geom === '☯') stats.yinyang++;  
            else if (geom === '✧⃝⚝') stats.selos++;  
            else if (geom === '◉') stats.olhos++;  
            else if (geom === '♾️') stats.infinitos++;  
            else if (geom === '📱') stats.tutorias++;  
        });  
          
        stats.total = Object.values(stats).reduce((a, b) => a + b, 0);  
        return stats;  
    },  
      
    // ● Função para testemunhar a geometria ativa (console)  
    testemunhar: function() {  
        console.log('%c┌─────────────────────────────────────────────────┐', 'color: #ffd700');  
        console.log('%c│        KOBLLUX · GEOMETRIA DO SUBCONSCIENTE     │', 'color: #ffd700');  
        console.log('%c├─────────────────────────────────────────────────┤', 'color: #ffd700');  
          
        Object.entries(this.opcodes).forEach(([op, data]) => {  
            const cor = this.getCorPorFrequencia(data.freq);  
            console.log(`%c│  ${op} · ${data.fase.padEnd(10)} · ${data.geom} · ${data.freq}Hz · ${data.elementos.length} elementos`, `color: ${cor}`);  
        });  
          
        console.log('%c├─────────────────────────────────────────────────┤', 'color: #ffd700');  
          
        const stats = this.stats();  
        console.log(`%c│  ● PONTOS: ${stats.pontos.toString().padStart(3)}   ― RETAS: ${stats.retas.toString().padStart(3)}   ▢ PLANOS: ${stats.planos.toString().padStart(3)}`, 'color: #7CFFB2');  
        console.log(`%c│  ◇ CRISTAIS: ${stats.cristais.toString().padStart(2)}   ⧉ CRUZES: ${stats.cruzes.toString().padStart(2)}   ☯ YIN-YANG: ${stats.yinyang.toString().padStart(2)}`, 'color: #ff9ad1');  
        console.log(`%c│  ✧⃝⚝ SELOS: ${stats.selos.toString().padStart(3)}   ◉ OLHOS: ${stats.olhos.toString().padStart(4)}   ♾️ INFINITOS: ${stats.infinitos.toString().padStart(2)}`, 'color: #4DE0FF');  
        console.log(`%c│  📱 TUTORIAIS: ${stats.tutorias.toString().padStart(2)}   TOTAL: ${stats.total.toString().padStart(4)} elementos`, 'color: #ffd700');  
          
        console.log('%c├─────────────────────────────────────────────────┤', 'color: #ffd700');  
        console.log('%c│  VERDADE × INTEGRAR ÷ Δ = ∴                     │', 'color: #ffd700');  
        console.log('%c│  144 PULSOS · 19.428 KOBLLUX · Δ = ∞           │', 'color: #ffd700');  
        console.log('%c└─────────────────────────────────────────────────┘', 'color: #ffd700');  
    },  
      
    // ● Helper para cores por frequência  
    getCorPorFrequencia: function(freq) {  
        const cores = {  
            432: '#67e6ff',  
            528: '#7CFFB2',  
            594: '#ff9ad1',  
            639: '#4DE0FF',  
            672: '#ff7a00',  
            768: '#b978ff',  
            777: '#ffd700',  
            852: '#00b894',  
            963: '#6c5ce7'  
        };  
        return cores[freq] || '#ffffff';  
    }  
};  
  
// ● Ativar escaneamento e testemunho após carregar a página  
document.addEventListener('DOMContentLoaded', () => {  
    setTimeout(() => {  
        KOBLLUX_GEOMETRY.scan().testemunhar();  
    }, 500);  
});  
