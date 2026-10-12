let chartInstance = null;

document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('userInput').value.trim();
    if (!query) return alert('Please enter a topic to search.');

    const btn = document.getElementById('searchBtn');
    btn.disabled = true;
    btn.innerText = 'Analyzing...';

    try {
        const response = await fetch('http://localhost:3000/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const result = await response.json();

        if (!result.success || result.data.length === 0) {
            alert(result.summary || 'No records returned.');
            return;
        }

        // 1. Show AI summary
        const summaryCard = document.getElementById('summaryCard');
        summaryCard.classList.remove('hidden');
        document.getElementById('summaryText').innerText = result.summary;

        // 2. Render horizontal bar chart (Full titles legible)
        const chartCard = document.getElementById('chartCard');
        chartCard.classList.remove('hidden');

        // Clean titles for chart axis
        const labels = result.data.map(item => {
            return item.title.length > 35 ? item.title.slice(0, 35) + '...' : item.title;
        });

        const fullTitles = result.data.map(item => item.title);
        const likes = result.data.map(item => item.score);
        const comments = result.data.map(item => item.comments);

        if (chartInstance) chartInstance.destroy();

        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TikTok Likes',
                        data: likes,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Comments',
                        data: comments,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Horizontal bars so video captions are readable
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            // Displays full caption/title on hover
                            title: function (context) {
                                return fullTitles[context[0].dataIndex];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });

        // 3. Populate live links list
        const sourcesCard = document.getElementById('sourcesCard');
        sourcesCard.classList.remove('hidden');

        const sourceList = document.getElementById('sourceList');
        sourceList.innerHTML = '';

        result.data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                <span class="meta-tag">• Likes: <strong>${item.score.toLocaleString()}</strong> • Comments: <strong>${item.comments.toLocaleString()}</strong> • Creator: @${item.author}</span>
            `;
            sourceList.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        alert('Server connection error. Make sure "node server.js" is running in your terminal.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Analyze';
    }
});