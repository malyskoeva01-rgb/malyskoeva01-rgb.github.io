
document.addEventListener('DOMContentLoaded', () => {
    const userSelect = document.getElementById('userSelect');
    const choreSelect = document.getElementById('choreSelect');
    const taskList = document.getElementById('taskList');
    const addBtn = document.getElementById('addBtn');

    async function loadMeta() {
        try {
            const res = await fetch('/api/meta');
            const data = await res.json();

            userSelect.innerHTML = data.users
                .map(u => `<option value="${u.id}">${u.navn}</option>`)
                .join('');

            choreSelect.innerHTML = data.tasks
                .map(t => `<option value="${t.id}">${t.tittel}</option>`)
                .join('');
        } catch (err) {
            console.error("Feil med metadata:", err);
        }
    }

    async function loadTasks() {
        try {
            const res = await fetch('/api/tasks');
            const tasks = await res.json();

            if (!tasks || tasks.length === 0) {
                taskList.innerHTML = '<p style="text-align:center; color:gray;">Ingen oppgaver foreløpig</p>';
            } else {
                taskList.innerHTML = tasks.map(t => `
                    <div class="task-card ${t.status === 'done' ? 'done' : ''}">
                        <div>
                            <b>👤 ${t.userName}</b>: ${t.taskTitle}
                            <span class="category-tag">${t.categoryName || 'Ingen kategori'}</span>
                            <div style="color: green;">⭐ +${t.points} poeng</div>
                        </div>
                        <div class="task-actions">
                            <input type="checkbox" class="done-checkbox" ${t.status === 'done' ? 'checked' : ''} 
                                onchange="toggleDone(${t.id}, this.checked)">
                            <button class="del-btn" onclick="deleteTask(${t.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }

            loadRanking();

        } catch (err) {
            console.error("Feil ved lasting av oppgaver:", err);
        }
    }

    async function loadRanking() {
        try {
            const res = await fetch('/api/ranking');
            const ranking = await res.json();

            const rankingList = document.getElementById('rankingList');
            if (!ranking || ranking.length === 0) {
                rankingList.innerHTML = '<li style="color: gray;">Ingen brukere med poeng</li>';
                return;
            }

            rankingList.innerHTML = ranking.map((u, i) => `
                <li><b>#${i+1} ${u.userName}</b>: ${u.totalPoints || 0} poeng</li>
            `).join('');
        } catch (err) {
            console.error("Feil ved lasting av rangering:", err);
        }
    }

    addBtn.onclick = async () => {
        const bruker_id = userSelect.value;
        const oppgave_id = choreSelect.value;

        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bruker_id, oppgave_id })
            });
            loadTasks();
        } catch (err) {
            console.error("Feil ved å legge til oppgave:", err);
        }
    };

    window.deleteTask = async (id) => {
        if (confirm("Vil du slette denne oppgaven?")) {
            try {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
                loadTasks();
            } catch (err) {
                console.error("Feil ved sletting av oppgave:", err);
            }
        }
    };

    window.toggleDone = async (id, checked) => {
        const newStatus = checked ? 'done' : 'pending';
        try {
            await fetch(`/api/tasks/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadTasks();
        } catch (err) {
            console.error("Feil ved oppdatering av status:", err);
        }
    };

    loadMeta();
    loadTasks();
});
