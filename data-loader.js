/* ============================================
   ESKONDIDINHO — Dynamic Data Loader
   Carrega events.json e occupied-tables.json
   de forma dinâmica (sem precisar de deploy)
   ============================================ */

// URL base dos dados — GitHub raw (gratuito, sem limites práticos)
// Será atualizado após criar o repositório GitHub
const DATA_BASE_URL = 'https://raw.githubusercontent.com/krum-lab/eskondidinho-data/main';

// Cache buster para evitar cache do CDN
function cacheBust(url) {
    return url + '?t=' + Math.floor(Date.now() / 60000); // Cache de 1 minuto
}

// ===== FETCH EVENTS =====
async function loadEventsData() {
    try {
        const resp = await fetch(cacheBust(DATA_BASE_URL + '/events.json'));
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.json();
    } catch (e) {
        console.warn('⚠️ Não foi possível carregar eventos remotos, tentando local:', e.message);
        // Fallback: tenta carregar do próprio domínio (versão estática deployada)
        try {
            const resp = await fetch('events.json?t=' + Date.now());
            if (resp.ok) return await resp.json();
        } catch (e2) { /* ignore */ }
        return null;
    }
}

// ===== FETCH OCCUPIED TABLES =====
async function loadOccupiedData() {
    try {
        const resp = await fetch(cacheBust(DATA_BASE_URL + '/occupied-tables.json'));
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.json();
    } catch (e) {
        console.warn('⚠️ Não foi possível carregar mesas remotas, tentando local:', e.message);
        try {
            const resp = await fetch('occupied-tables.json?t=' + Date.now());
            if (resp.ok) return await resp.json();
        } catch (e2) { /* ignore */ }
        return null;
    }
}

// ===== RENDER EVENT CARDS (index.html) =====
function renderEventCards(eventsData) {
    const grid = document.getElementById('eventsGrid');
    if (!grid || !eventsData || !eventsData.events) return;

    const monthAbbrMap = {
        'Janeiro': 'JAN', 'Fevereiro': 'FEV', 'Março': 'MAR',
        'Abril': 'ABR', 'Maio': 'MAI', 'Junho': 'JUN',
        'Julho': 'JUL', 'Agosto': 'AGO', 'Setembro': 'SET',
        'Outubro': 'OUT', 'Novembro': 'NOV', 'Dezembro': 'DEZ'
    };
    // Lookup por número do mês (01..12) → abbr, pra cada card usar o seu próprio mês
    const numToAbbr = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const monthAbbr = monthAbbrMap[eventsData.month] || 'MAR'; // fallback do header

    // Atualiza o título do mês
    const monthTitle = document.querySelector('#eventos .section-title span');
    if (monthTitle) monthTitle.textContent = eventsData.month;

    // Limpa conteúdo existente
    grid.innerHTML = '';

    const now = new Date();

    eventsData.events.forEach((ev, i) => {
        const [y, m, d] = ev.date.split('-').map(Number);
        const evDate = new Date(y, m - 1, d);
        const evEnd = new Date(y, m - 1, d + 1, 4, 0, 0); // Evento acaba 04h do dia seguinte

        // Monta os nomes das bandas
        const bandsHtml = (ev.bands || [])
            .map(b => `<li>${escapeHtml(cleanBandName(b))}</li>`)
            .join('\n');

        // Promo formatada
        const promo = formatPromo(ev.promo || '');
        const promoHtml = promo ? `<span class="event-card-promo">🎉 ${escapeHtml(promo)}</span>` : '';

        // Verifica se é passado
        const isPast = now > evEnd;
        const btnText = isPast ? 'Encerrado' : 'Comprar Ingresso';
        const btnStyle = isPast ? 'pointer-events: none;' : '';
        const pastClass = isPast ? ' past-event' : '';

        const card = document.createElement('div');
        card.className = `event-card reveal${pastClass}`;
        card.setAttribute('data-date', ev.date);
        const evMonthAbbr = numToAbbr[m] || monthAbbr;
        card.innerHTML = `
            <div class="event-card-date">
                <div class="event-card-day">
                    <span class="day-number">${ev.day}</span>
                    <span class="day-month">${evMonthAbbr}</span>
                </div>
                <span class="event-card-weekday">${ev.weekday_full}</span>
            </div>
            <h3 class="event-card-name">${escapeHtml(ev.name)}</h3>
            <ul class="event-card-bands">
                ${bandsHtml}
            </ul>
            <p class="event-card-time">
                <i class="far fa-clock"></i> ${(ev.time || '22:00').replace(':00', 'h')} às 04h
            </p>
            ${promoHtml}
            <a href="${isPast ? '#' : escapeHtml(ev.link_ingresso)}"
                target="_blank" class="event-card-btn" style="${btnStyle}">${btnText}</a>
        `;

        grid.appendChild(card);
    });

    // Após renderizar, aplica badges dinâmicos
    applyDynamicBadges();
    // Trigger scroll reveal nos novos cards
    handleScrollReveal();
}

// ===== RENDER CHECKOUT CARDS (reservas.html) =====
function renderCheckoutCards(eventsData) {
    const grid = document.querySelector('.checkout-grid');
    if (!grid || !eventsData || !eventsData.events) return;

    const monthAbbrMap = {
        'Janeiro': 'JAN', 'Fevereiro': 'FEV', 'Março': 'MAR',
        'Abril': 'ABR', 'Maio': 'MAI', 'Junho': 'JUN',
        'Julho': 'JUL', 'Agosto': 'AGO', 'Setembro': 'SET',
        'Outubro': 'OUT', 'Novembro': 'NOV', 'Dezembro': 'DEZ'
    };
    const monthAbbr = monthAbbrMap[eventsData.month] || 'MAR';
    const numToAbbr = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    grid.innerHTML = '';

    eventsData.events.forEach(ev => {
        if (!ev.id_reserva) return; // Só mostra eventos com link de reserva

        const bandsDisplay = (ev.bands || [])
            .map(b => escapeHtml(cleanBandName(b)))
            .join(' • ');

        const evMonthNum = parseInt(ev.date.split('-')[1], 10);
        const evMonthAbbr = numToAbbr[evMonthNum] || monthAbbr;

        const card = document.createElement('a');
        card.href = `mapa.html?id=${ev.id_reserva}`;
        card.className = 'checkout-card';
        card.setAttribute('data-date', ev.date);
        card.innerHTML = `
            <div class="checkout-date">
                <span class="checkout-day">${ev.day}</span>
                <span class="checkout-month">${evMonthAbbr}</span>
                <span class="checkout-weekday">${ev.weekday}</span>
            </div>
            <div class="checkout-info">
                <h3>${escapeHtml(ev.name)}</h3>
                <p>${bandsDisplay}</p>
            </div>
            <div class="checkout-action"><span class="checkout-btn">Reservar Mesa →</span></div>
        `;

        grid.appendChild(card);
    });

    // Aplica badges de reservas
    applyCheckoutBadges();
}

// ===== RENDER MAPA EVENTS (mapa.html) =====
function renderMapaEvents(eventsData) {
    if (!eventsData || !eventsData.events || typeof MAPA_PAGE === 'undefined') return;

    // Constrói o objeto EVENTS a partir do JSON
    window.EVENTS = {};
    eventsData.events.forEach(ev => {
        if (!ev.id_reserva) return;
        const bandsText = (ev.bands || []).map(b => cleanBandName(b)).join(' • ');
        window.EVENTS[ev.id_reserva] = {
            date: ev.date,
            day: ev.day,
            weekday: ev.weekday,
            name: ev.name,
            bands: bandsText,
            url: ev.link_reserva || ''
        };
    });

    // Atualiza a interface com o evento selecionado
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    const eventData = window.EVENTS[eventId];

    if (!eventData) {
        document.getElementById('eventName').textContent = 'Evento não encontrado';
        document.getElementById('eventBands').textContent = 'Volte e selecione um evento válido.';
    } else {
        document.getElementById('eventDay').textContent = eventData.day;
        document.getElementById('eventWeekday').textContent = eventData.weekday;
        document.getElementById('eventName').textContent = eventData.name;
        document.getElementById('eventBands').textContent = eventData.bands;
        document.title = `Mesa — ${eventData.name} | ESKONDIDINHO`;
        // Salva para uso pelo código de clique das mesas
        window.currentEventData = eventData;
    }
}

// ===== HELPERS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cleanBandName(band) {
    if (!band) return '';
    return band.replace(/\s*\(\s*(ELAS|ELA|FREE|UNISSEX).*$/i, '').trim().replace(/\($/, '').trim();
}

function formatPromo(promo) {
    if (!promo) return '';
    // Promo sempre em CAIXA ALTA (decisão do Ruan — fica melhor pra promoção).
    let p = promo.trim().replace(/[…]+$/, '').replace(/\.+$/, '').trim();
    // Conserta truncamentos comuns do scraping (…) completando pra "ATÉ 23H"
    if (/^ELAS\s+F$/i.test(p)) p = 'ELAS FREE ATÉ 23H';
    p = p.replace(/\bAT[ÉE]\s+AS$/i, 'ATÉ AS 23H').replace(/\bAT[ÉE]$/i, 'ATÉ 23H');
    return p.toUpperCase();
}

// ===== DYNAMIC BADGES (index.html event cards) =====
function applyDynamicBadges() {
    const now = new Date();
    const cards = document.querySelectorAll('.event-card[data-date]');
    if (!cards.length) return;

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function getWeekEnd(date) {
        const s = getWeekStart(date);
        const e = new Date(s);
        e.setDate(e.getDate() + 6);
        e.setHours(23, 59, 59, 999);
        return e;
    }

    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);
    let nextCard = null, nextDate = null;

    const monthNamesPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    cards.forEach(card => {
        const ds = card.dataset.date;
        const [y, m, d] = ds.split('-').map(Number);
        const evDate = new Date(y, m - 1, d);
        const evEnd = new Date(y, m - 1, d + 1, 4, 0, 0);

        if (now > evEnd) return; // Past event — already handled

        const badges = [];
        const isToday = now.getFullYear() === evDate.getFullYear() && now.getMonth() === evDate.getMonth() && now.getDate() === evDate.getDate();
        if (isToday) {
            badges.push('<span class="event-badge badge-today">🔥 HOJE!</span>');
        } else if (evDate >= weekStart && evDate <= weekEnd) {
            badges.push('<span class="event-badge badge-week">📅 ESSA SEMANA!</span>');
        }

        // 🗓️ Badge de mês futuro — quando o evento é num mês diferente do atual
        // (ex.: estamos em Maio e o card é Junho), avisa o cliente.
        const sameMonth = evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth();
        if (!sameMonth && evDate > now) {
            const evMonthName = monthNamesPt[evDate.getMonth()].toUpperCase();
            badges.push(`<span class="event-badge badge-next-month">🗓️ ${evMonthName}</span>`);
            badges.push('<span class="event-badge badge-next-month-label">➡️ PRÓXIMO MÊS</span>');
        }

        if (!nextCard || evDate < nextDate) { nextCard = card; nextDate = evDate; }

        if (badges.length) {
            const container = document.createElement('div');
            container.className = 'event-badges';
            container.innerHTML = badges.join('');
            card.prepend(container);
        }
    });

    if (nextCard) {
        let container = nextCard.querySelector('.event-badges');
        if (!container) {
            container = document.createElement('div');
            container.className = 'event-badges';
            nextCard.prepend(container);
        }
        const badge = document.createElement('span');
        badge.className = 'event-badge badge-next';
        badge.textContent = '🔥 Próximo Evento!';
        container.prepend(badge);
    }
}

// ===== DYNAMIC BADGES (reservas.html checkout cards) =====
function applyCheckoutBadges() {
    const now = new Date();
    const cards = document.querySelectorAll('.checkout-card[data-date]');

    function getEventEnd(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d + 1, 4, 0, 0);
    }
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function getWeekEnd(date) {
        const s = getWeekStart(date);
        const e = new Date(s);
        e.setDate(e.getDate() + 6);
        e.setHours(23, 59, 59, 999);
        return e;
    }

    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);
    let nextEventCard = null, nextEventDate = null;

    cards.forEach(card => {
        const dateStr = card.dataset.date;
        const [y, m, d] = dateStr.split('-').map(Number);
        const eventDate = new Date(y, m - 1, d);
        const eventEnd = getEventEnd(dateStr);

        if (now > eventEnd) {
            card.classList.add('past-event');
            card.querySelector('.checkout-btn').textContent = 'Encerrado';
            card.style.pointerEvents = 'none';
            card.removeAttribute('href');
            return;
        }

        const isToday = now.getFullYear() === eventDate.getFullYear() && now.getMonth() === eventDate.getMonth() && now.getDate() === eventDate.getDate();
        if (isToday) {
            const badge = document.createElement('span');
            badge.className = 'event-badge badge-hoje';
            badge.textContent = '🔥 HOJE!';
            card.appendChild(badge);
        } else if (eventDate >= weekStart && eventDate <= weekEnd) {
            const badge = document.createElement('span');
            badge.className = 'event-badge badge-semana';
            badge.textContent = '📅 ESSA SEMANA!';
            card.appendChild(badge);
        }

        if (!nextEventCard || eventDate < nextEventDate) {
            nextEventCard = card;
            nextEventDate = eventDate;
        }
    });

    if (nextEventCard) {
        const badge = document.createElement('span');
        badge.className = 'event-badge badge-proximo';
        badge.textContent = '🔥 PRÓXIMO EVENTO!';
        nextEventCard.prepend(badge);
    }
}
