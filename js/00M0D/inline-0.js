
    (function(){
      function ensureAtom(){
        var host = document.getElementById('bootLoader');
        if (!host) return;
        // If markup already exists, rebuild as atom loader
        var txt = (host.querySelector('.tagline') ? host.querySelector('.tagline').textContent : 'Sempre Único, Sempre seu');
        host.innerHTML = '';
        var wrap = document.createElement('div'); wrap.className = 'loader-wrap';
        var atom = document.createElement('div'); atom.className = 'atom';
        var nucleus = document.createElement('div'); nucleus.className = 'nucleus'; atom.appendChild(nucleus);
        ['',' fast',' slow'].forEach(function(spd, idx){
          var orbit = document.createElement('div'); orbit.className = 'orbit spin'+spd + (idx===1?' o2': (idx===2?' o3':''));
          var e = document.createElement('div'); e.className = 'electron';
          orbit.appendChild(e); atom.appendChild(orbit);
        });
        var title = document.createElement('span'); title.className = 'tagline'; title.textContent = txt;
        var dots = document.createElement('div'); dots.className = 'dots';
        dots.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        wrap.appendChild(atom); wrap.appendChild(title); wrap.appendChild(dots);
        host.appendChild(wrap);
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureAtom);
      else ensureAtom();
    })();
  