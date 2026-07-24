(function(){
  var menuButtons=document.querySelectorAll('[data-menu-btn]');
  menuButtons.forEach(function(btn){
    var target=document.getElementById(btn.getAttribute('aria-controls'));
    if(!target)return;
    btn.addEventListener('click',function(){
      var open=target.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(open));
      btn.textContent=open?'✕':'☰';
    });
    target.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click',function(){
        target.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
        btn.textContent='☰';
      });
    });
  });

  document.querySelectorAll('[data-newsletter-form]').forEach(function(form){
    var input=form.querySelector('input[type="email"]');
    var message=form.querySelector('[data-form-message]');
    form.addEventListener('submit',function(event){
      event.preventDefault();
      var value=(input&&input.value||'').trim();
      if(!value||!/.+@.+\..+/.test(value)){
        if(message)message.textContent='Enter a valid email address to continue.';
        return;
      }
      if(message)message.textContent='Opening your email app to complete your newsletter signup.';
      var subject=encodeURIComponent('Newsletter Signup');
      var body=encodeURIComponent('Please add '+value+' to the The Straight Cut newsletter list.');
      window.location.href='mailto:hello@thestraightcut.net?subject='+subject+'&body='+body;
    });
  });

  var latestDeals=(window.latestDeals||[]);
  var latestGrid=document.getElementById('latestDealsGrid');
  if(latestGrid&&latestDeals.length){
    latestGrid.innerHTML=latestDeals.map(function(item){
      return '<article class="card-shell"><div class="card-media"><img loading="lazy" src="'+item.image+'" alt="'+item.title+'"></div><div class="card-copy"><span class="card-tag">'+item.tag+'</span><h3>'+item.title+'</h3><p>'+item.text+'</p><a class="card-action" href="'+item.href+'">Read Guide →</a></div></article>';
    }).join('');
  }

  var searchInput=document.getElementById('dealSearch');
  var resultsSection=document.getElementById('searchResultsSection');
  var resultsGrid=document.getElementById('searchResultsGrid');
  var emptyState=document.getElementById('searchEmpty');
  var index=(window.siteSearchIndex||[]);
  if(searchInput&&resultsSection&&resultsGrid&&emptyState){
    var renderResults=function(query){
      var q=query.trim().toLowerCase();
      if(q.length<2){
        resultsSection.hidden=true;
        resultsGrid.innerHTML='';
        emptyState.textContent='';
        return [];
      }
      var matches=index.filter(function(item){
        return [item.type,item.title,item.text,item.keywords].join(' ').toLowerCase().indexOf(q)!==-1;
      }).slice(0,8);
      resultsSection.hidden=false;
      if(!matches.length){
        resultsGrid.innerHTML='';
        emptyState.textContent='No direct matches yet. Press Enter to search Amazon with the current query.';
        return matches;
      }
      emptyState.textContent='';
      resultsGrid.innerHTML=matches.map(function(item){
        var target=item.external?' target="_blank" rel="sponsored nofollow"':'';
        return '<article class="card-shell"><div class="card-copy"><span class="card-tag">'+item.type+'</span><h3>'+item.title+'</h3><p>'+item.text+'</p><a class="card-action" href="'+item.href+'"'+target+'>'+(item.external?'Open Link →':'Open Page →')+'</a></div></article>';
      }).join('');
      return matches;
    };
    searchInput.addEventListener('input',function(){renderResults(searchInput.value);});
    searchInput.addEventListener('keydown',function(event){
      if(event.key!=='Enter')return;
      event.preventDefault();
      var matches=renderResults(searchInput.value);
      if(matches[0]){
        if(matches[0].external){window.open(matches[0].href,'_blank','noopener');}
        else{window.location.href=matches[0].href;}
        return;
      }
      var q=encodeURIComponent(searchInput.value.trim()||'deals');
      window.open('amazon.html#sitestripe-links-needed'+q+'&tag=straightcutgu-20','_blank','noopener');
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(function(node){
    node.textContent=String(new Date().getFullYear());
  });

  // Point the injected "Latest Post" bar (sc-blog-snippet) at the on-site article
  // instead of the retired external URL. The snippet is injected after this script,
  // so run once the document has finished parsing.
  function fixBlogBar(){
    document.querySelectorAll('.sc-blog-bar a').forEach(function(link){
      var href=link.getAttribute('href')||'';
      if(href.indexOf('/kitchen-upgrades-that-get-used.html')!==-1)return;
      if(href.indexOf('fascinating-kheer')!==-1||/\.netlify\.app/.test(href)){
        link.setAttribute('href','/kitchen-upgrades-that-get-used.html');
      }
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',fixBlogBar);
  }else{
    fixBlogBar();
  }
})();
