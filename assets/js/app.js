/* =========================
   App State
========================= */
let navItems = []
let sections = []
let isClickScrolling = false
let clickScrollTimer = null
let spyObserver = null
let sidebarCenterTimer = null
let lastActiveId = null


/* =========================
   Utils
========================= */
function setActiveNav(targetId) {
    let activeItem = null
    navItems.forEach(item => {
        const isActive = item.dataset.target === targetId
        item.classList.toggle('active', isActive)
        if (isActive) activeItem = item
    })
    return activeItem
}


function scrollSidebarToItem(navItem) {
    const sidebarEl = document.getElementById('sidebar')
    if (!sidebarEl || !navItem) return

    // ✅ 折叠态不居中（避免干扰）
    if (sidebarEl.classList.contains('collapsed')) return

    // 只有 sidebar 本身可滚动时才滚它（避免影响整页）
    const oy = getComputedStyle(sidebarEl).overflowY
    const scrollable =
        (oy === 'auto' || oy === 'scroll') && sidebarEl.scrollHeight > sidebarEl.clientHeight

    if (!scrollable) return

    const top =
        navItem.offsetTop - (sidebarEl.clientHeight / 2 - navItem.clientHeight / 2)

    sidebarEl.scrollTo({ top, behavior: 'smooth' })
}



/* =========================
   Render
========================= */
function render(data) {
    const sidebar = document.getElementById('sidebar')
    const container = document.getElementById('container')
    if (!sidebar || !container) return

    sidebar.innerHTML = ''
    container.innerHTML = ''
    navItems = []
    sections = []

    // Sidebar header（折叠按钮）
    const header = document.createElement('div')
    header.className = 'sidebar-header'
    header.innerHTML = `<button id="collapseToggle" title="折叠侧栏">⏪</button>`
    sidebar.appendChild(header)

    data.forEach((group, index) => {
        // Sidebar item
        const navItem = document.createElement('div')
        navItem.className = 'nav-item'
        navItem.dataset.target = `section-${index}`
        navItem.dataset.title = group.category

        navItem.innerHTML = `
      <span class="nav-left">
        <span class="nav-icon">${group.icon || '📁'}</span>
        <span class="nav-title">${group.category}</span>
      </span>
      <span class="nav-count">${group.items.length}</span>
    `

        navItem.onclick = () => {
            const targetId = `section-${index}`
            const anchor = document.getElementById(targetId)
            if (!anchor) return

            // 1) 锁定高亮
            isClickScrolling = true
            clearTimeout(clickScrollTimer)
            setActiveNav(targetId)

            // 2) 滚到右侧锚点（整页滚动）
            anchor.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })

            // 3) ✅ 侧栏居中  只有当 sidebar 自己能滚动时，才居中 sidebar（否则会把整页滚歪）
            scrollSidebarToItem(navItem)
            /*const sidebarEl = document.getElementById('sidebar')
            if (sidebarEl) {
                const oy = getComputedStyle(sidebarEl).overflowY
                const sidebarScrollable =
                    (oy === 'auto' || oy === 'scroll') && sidebarEl.scrollHeight > sidebarEl.clientHeight

                if (sidebarScrollable) {
                    const top =
                        navItem.offsetTop - (sidebarEl.clientHeight / 2 - navItem.clientHeight / 2)

                    sidebarEl.scrollTo({ top, behavior: 'smooth' })
                }
            }*/

            // 4) 解锁
            clickScrollTimer = setTimeout(() => {
                isClickScrolling = false
            }, 400)
        }


        sidebar.appendChild(navItem)
        navItems.push(navItem)

        // Content section（anchor + 标题 + 卡片）
        const section = document.createElement('section')
        section.className = 'category'
        section.innerHTML = `
      <div class="section-anchor" id="section-${index}"></div>
      <h2>${group.category}</h2>
      <div class="grid">
        ${group.items.map(item => `
          <a class="card" href="${item.url}" target="_blank">
            <img src="${item.icon || 'assets/img/stormlikes.avif'}" />
            <div>
              <h3>${item.name}</h3>
              <p>${item.desc || ''}</p>
            </div>
          </a>
        `).join('')}
      </div>
    `
        container.appendChild(section)
        sections.push(section)
    })

    initSidebarCollapse()
    initScrollSpy()
}

/* =========================
   Scroll Spy (window)
========================= */
function initScrollSpy() {
    if (!sections.length) return

    // 防止 render 多次导致重复 observer
    if (spyObserver) spyObserver.disconnect()

    spyObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return
                if (isClickScrolling) return

                const id = entry.target.id

// 避免重复触发同一个 id 导致抖动
                if (id === lastActiveId) return
                lastActiveId = id

                const activeItem = setActiveNav(id)

// 侧栏居中做一个轻量防抖（避免滚动时频繁触发）
                clearTimeout(sidebarCenterTimer)
                sidebarCenterTimer = setTimeout(() => {
                    scrollSidebarToItem(activeItem)
                }, 80)

            })
        },
        {
            root: null, // ✅ 方案A：监听 window
            rootMargin: '-40% 0px -50% 0px',
            threshold: 0
        }
    )


    sections.forEach(section => {
        const anchor = section.querySelector('.section-anchor')
        if (anchor) spyObserver.observe(anchor)
    })
}

/* =========================
   Sidebar Collapse
========================= */
function initSidebarCollapse() {
    const sidebar = document.querySelector('.sidebar')
    const toggleBtn = document.getElementById('collapseToggle')
    if (!sidebar || !toggleBtn) return

    const collapsed = localStorage.getItem('sidebar-collapsed')
    if (collapsed === 'true') {
        sidebar.classList.add('collapsed')
        toggleBtn.textContent = '⏩'
    } else {
        toggleBtn.textContent = '⏪'
    }

    toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed')
        const isCollapsed = sidebar.classList.contains('collapsed')
        toggleBtn.textContent = isCollapsed ? '⏩' : '⏪'
        localStorage.setItem('sidebar-collapsed', isCollapsed)
    }
}

/* =========================
   Theme (Default Dark)
========================= */
function initTheme() {
    const toggle = document.getElementById('themeToggle')
    if (!toggle) return

    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'light') {
        document.body.classList.remove('dark')
        toggle.textContent = '🌙'
    } else {
        document.body.classList.add('dark')
        toggle.textContent = '☀️'
    }

    toggle.onclick = () => {
        const isDark = document.body.classList.toggle('dark')
        toggle.textContent = isDark ? '☀️' : '🌙'
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }
}

/* =========================
   Search
========================= */
function initSearch() {
    const searchInput = document.getElementById('search')
    if (!searchInput) return

    searchInput.addEventListener('input', e => {
        const keyword = e.target.value.toLowerCase()

        const filtered = navData
            .map(group => ({
                ...group,
                items: group.items.filter(item =>
                    item.name.toLowerCase().includes(keyword) ||
                    (item.desc && item.desc.toLowerCase().includes(keyword))
                )
            }))
            .filter(group => group.items.length)

        render(filtered)
    })
}

/* =========================
   App Init (唯一入口)
========================= */
document.addEventListener('DOMContentLoaded', () => {
    render(navData)
    initTheme()
    initSearch()
})
