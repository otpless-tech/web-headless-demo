
export const appendResponse = (response) => {
    const input = document.getElementById('response');
    const newContent = document.createElement('div');
    if (input.children.length > 0) {
        newContent.classList.add('response-item');
        newContent.classList.add('subtitle');
    }
    newContent.textContent = JSON.stringify(response);
    input.appendChild(newContent);
}