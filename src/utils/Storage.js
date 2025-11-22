export class StorageManager {
    static getRank() {
        return JSON.parse(localStorage.getItem('cubeRankSafe')) || [];
    }

    static saveScore(name, time) {
        const rank = this.getRank();
        rank.push({ name, time });
        rank.sort((a, b) => a.time.localeCompare(b.time));
        if (rank.length > 5) rank.splice(5);
        localStorage.setItem('cubeRankSafe', JSON.stringify(rank));
        return rank;
    }
}